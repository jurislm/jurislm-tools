#!/usr/bin/env bash
# PreToolUse guard: block the skip-hooks flag, and block pushes to the default
# branch.
#
# Why: both are named in the global safety prohibitions. The prohibition text
# stays in ~/.claude/CLAUDE.md as well - this hook is the enforcement layer,
# not a replacement for it. A hook only sees the literal Bash command; the
# resident text covers everything the hook cannot see.
#
# Matching is anchored to a real command position (start of line, or after
# ; & | && || ) so that merely MENTIONING a flag inside echo/printf/heredoc
# text is not blocked. An earlier version matched the bare substring and
# denied `echo "... the flag ..."` - it also made this very file impossible
# to edit through Bash. A quoted string that itself looks like a git command
# can still match; removing that residue needs a real shell parser and is not
# worth the complexity.
set -uo pipefail

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null || printf '')

deny() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

# A git invocation in real command position, not inside quoted prose.
GIT_AT_CMD='(^|[;&|(]|&&|\|\|)[[:space:]]*(sudo[[:space:]]+)?git[[:space:]]+'

# The flag is assembled rather than written literally so that editing this
# file through Bash does not trip the guard defined in this same file.
SKIP_FLAG='--no-'"verify"

# --- guard 1: skip-hooks flag on an actual git command ----------------------
if printf '%s' "$cmd" | grep -qE "${GIT_AT_CMD}[a-z-]+[^;&|]*${SKIP_FLAG}"; then
  deny "全域安全禁令：不使用 ${SKIP_FLAG}。它會跳過 pre-commit / pre-push hook，讓未經檢查的內容進入版控。請移除該旗標重跑；若是 hook 本身壞了，修 hook，不要繞過它。（若這只是文字內容而不是真的要執行，改寫指令避開這個形狀即可。）"
fi

# --- guard 2: push to the default branch ------------------------------------
#
# `git` accepts global options before the subcommand, so `git -C <path> push`
# is a push. Matching only `git[[:space:]]+push` missed every one of those.
# The option list is enumerated rather than left open (`git[^;&|]*push` would
# match `git log --grep push`, which pushes nothing).
GIT_GLOBAL_OPT='(-C[[:space:]]+[^[:space:]]+|-c[[:space:]]+[^[:space:]]+|--git-dir=[^[:space:]]+|--work-tree=[^[:space:]]+|--no-pager|-P)[[:space:]]+'
printf '%s' "$cmd" | grep -qE "${GIT_AT_CMD}(${GIT_GLOBAL_OPT})*push([[:space:]]|$)" || exit 0

# Which repository does this command actually act on?
#
# The hook runs in the SESSION's working directory, which is frequently a
# different repository than the one the command targets - `cd <other-repo> &&
# git push ...` and `git -C <path> push ...` are both routine. Evaluating the
# session repo there is simply the wrong question, and it produced false
# denials: pushing a feature branch in repo B was blocked because repo A's
# checkout happened to be sitting on its own default branch. The guard was
# answering "is the session repo on its default branch", not "does this command
# push to a default branch".
#
# Resolution order: an explicit `git -C <path>` wins, then the last `cd <path>`
# that precedes the push on the same line, then the session cwd. Resolution
# never ALLOWS anything on its own - if a named path is missing, unreadable, or
# not a work tree, the check falls back to the session cwd rather than passing.
resolve_target() {
  local raw="" expanded="" before=""

  # `git -C <path>` names the repository on the git command itself.
  raw=$(printf '%s' "$cmd" \
    | grep -oE "${GIT_AT_CMD}-C[[:space:]]+('[^']*'|\"[^\"]*\"|[^[:space:];&|]+)" \
    | tail -1 \
    | sed -E "s#.*-C[[:space:]]+##")

  # Otherwise the last `cd` BEFORE the push sets the directory for it. Anything
  # after the push cannot affect it, so the command is truncated there first.
  if [ -z "$raw" ]; then
    before=$(printf '%s' "$cmd" | awk '
      { i = match($0, /(^|[;&|(])[[:space:]]*(sudo[[:space:]]+)?git[[:space:]]+([^;&|]*[[:space:]])?push([[:space:]]|$)/)
        print (i > 0) ? substr($0, 1, i - 1) : $0 }')
    # awk here may over-reach (its pattern is deliberately loose so it always
    # finds *a* push to cut at); over-reaching only shortens the prefix, which
    # at worst drops a `cd` and falls back to the session cwd. Never the other
    # way round.
    raw=$(printf '%s' "$before" \
      | grep -oE "(^|[;&|(]|&&|\|\|)[[:space:]]*cd[[:space:]]+('[^']*'|\"[^\"]*\"|[^[:space:];&|]+)" \
      | tail -1 \
      | sed -E "s#.*cd[[:space:]]+##")
  fi

  [ -z "$raw" ] && return 1

  # Strip one layer of quoting; expand a leading ~ (the shell would have).
  expanded=${raw#[\'\"]}
  expanded=${expanded%[\'\"]}
  # The tilde is held in a variable because here it is a literal character to
  # MATCH (the command text kept it unexpanded), not a path to expand - written
  # inline it reads as an expansion bug to both humans and shellcheck.
  local tilde='~'
  case "$expanded" in
    "$tilde") expanded="$HOME" ;;
    "$tilde"/*) expanded="$HOME/${expanded#"$tilde"/}" ;;
  esac

  # An unexpanded variable, a subshell, or a glob tells us nothing about the
  # real path - say so, and let the caller fall back to the session cwd.
  case "$expanded" in *'$'* | *'`'* | *'*'*) return 1 ;; esac
  [ -d "$expanded" ] || return 1
  git -C "$expanded" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 1

  printf '%s' "$expanded"
}

target=$(resolve_target) || target=""

# Run every subsequent query against the resolved repository.
git_target() {
  if [ -n "$target" ]; then
    git -C "$target" "$@"
  else
    git "$@"
  fi
}

remote=$(git_target remote 2>/dev/null | head -1)
[ -z "$remote" ] && exit 0

default=$(git_target symbolic-ref --short "refs/remotes/${remote}/HEAD" 2>/dev/null | sed "s#^${remote}/##")
[ -z "$default" ] && exit 0

reason="全域安全禁令：不直接 push 到預設分支 ${default}（等同觸發 production 部署）。走 feature 分支開 PR；一件工程案件請用 jt-harness-plugin:engineering-delivery。"

case " $cmd " in
  *" ${default} "* | *":${default} "* | *" ${default}:"*)
    deny "$reason"
    ;;
esac

current=$(git_target rev-parse --abbrev-ref HEAD 2>/dev/null || printf '')
[ "$current" = "$default" ] && deny "$reason"

exit 0
