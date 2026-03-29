#!/bin/bash
# ft_autoresearch.sh - run autoresearch for financial tracker
#
# runs scopes sequentially in a tmux session. each scope gets its own
# worktree so main checkout stays clean.
#
# usage:
#   ./scripts/ft_autoresearch.sh                    # run all scopes sequentially
#   ./scripts/ft_autoresearch.sh <scope> [iter]     # run one scope
#   ./scripts/ft_autoresearch.sh --list
#   ./scripts/ft_autoresearch.sh --status
#   ./scripts/ft_autoresearch.sh --kill
#   ./scripts/ft_autoresearch.sh --merge
#
# crontab (daily 2am):
#   0 2 * * * /Users/juanestebannecoecheagtz./Documents/JENG/financial_tracker/scripts/ft_autoresearch.sh

set -euo pipefail

REPO_ROOT="/Users/juanestebannecoecheagtz./Documents/JENG/financial_tracker"
TMUX_SESSION="ft-autoresearch"
LOG_DIR="$REPO_ROOT/logs/autoresearch"
TIMEOUT_MINUTES="${AUTORESEARCH_TIMEOUT:-30}"
ITERATIONS="${AUTORESEARCH_ITERATIONS:-10}"

SCOPES=(
    expenses
    income
    balance
    statistics
    budgets
    cards
    subscriptions
    deposits
    settings
    add
    dashboard
    dal
    layout
    hooks
    api
)

# ─────────────────────────────────────────────────────────────────────────────

ensure_session() {
    if ! tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        tmux new-session -d -s "$TMUX_SESSION" -c "$REPO_ROOT" "zsh --login"
        sleep 2
        echo "created session: $TMUX_SESSION"
    fi
}

list_scopes() {
    echo "scopes:"
    for scope in "${SCOPES[@]}"; do
        local count
        count=$(scope_file_count "$scope")
        printf "  %-20s %3d files\n" "$scope" "$count"
    done
}

scope_file_count() {
    local scope="$1"
    case "$scope" in
        expenses)       find "$REPO_ROOT/app/(app)/expenses" "$REPO_ROOT/components/forms/ExpenseForm.tsx" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l ;;
        income)         find "$REPO_ROOT/app/(app)/income" "$REPO_ROOT/app/(app)/add-income" "$REPO_ROOT/components/forms/IncomeForm.tsx" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l ;;
        balance)        find "$REPO_ROOT/app/(app)/balance" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l ;;
        statistics)     find "$REPO_ROOT/app/(app)/statistics" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l ;;
        budgets)        find "$REPO_ROOT/app/(app)/budgets" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l ;;
        cards)          find "$REPO_ROOT/app/(app)/cards" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l ;;
        subscriptions)  find "$REPO_ROOT/app/(app)/subscriptions" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l ;;
        deposits)       find "$REPO_ROOT/app/(app)/deposits" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l ;;
        settings)       find "$REPO_ROOT/app/(app)/settings" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l ;;
        add)            find "$REPO_ROOT/app/(app)/add" "$REPO_ROOT/components/forms" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l ;;
        dashboard)      echo 1 ;;
        dal)            find "$REPO_ROOT/lib/supabase/queries.ts" "$REPO_ROOT/lib/types" -name "*.ts" 2>/dev/null | wc -l ;;
        layout)         find "$REPO_ROOT/components/layout" "$REPO_ROOT/components/shared" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l ;;
        hooks)          find "$REPO_ROOT/hooks" -name "*.ts" 2>/dev/null | wc -l ;;
        api)            find "$REPO_ROOT/app/api" -name "*.ts" 2>/dev/null | wc -l ;;
        *)              echo 0 ;;
    esac | tr -d ' '
}

show_status() {
    if ! tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        echo "session '$TMUX_SESSION' not running"
    else
        echo "windows:"
        tmux list-windows -t "$TMUX_SESSION" -F '  #{window_index}: #{window_name}' 2>/dev/null
    fi
    echo ""
    echo "recent logs:"
    ls -lt "$LOG_DIR"/*.log 2>/dev/null | head -10 | sed 's/^/  /' \
        || echo "  (no logs)"
}

kill_session() {
    if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        tmux kill-session -t "$TMUX_SESSION"
        echo "killed session: $TMUX_SESSION"
    else
        echo "session '$TMUX_SESSION' not running"
    fi
}

run_scope() {
    local scope="$1"
    local iterations="${2:-$ITERATIONS}"
    local timestamp
    timestamp="$(date +%Y%m%d_%H%M%S)"
    local branch="autoresearch/${scope}/${timestamp}"
    local worktree="/tmp/ft-autoresearch-wt-${scope}"
    local log_file="$LOG_DIR/${scope}_${timestamp}.log"

    ensure_session
    mkdir -p "$LOG_DIR"

    # kill previous window for this scope if still hanging
    if tmux list-windows -t "$TMUX_SESSION" -F '#{window_name}' 2>/dev/null | grep -qx "$scope"; then
        tmux kill-window -t "$TMUX_SESSION:$scope" 2>/dev/null || true
        sleep 1
    fi

    # clean up stale worktree from previous run
    git -C "$REPO_ROOT" worktree remove --force "$worktree" 2>/dev/null || true
    rm -rf "$worktree" 2>/dev/null || true
    git -C "$REPO_ROOT" branch -D "$branch" 2>/dev/null || true

    # create worktree
    if ! git -C "$REPO_ROOT" worktree add -b "$branch" "$worktree" main 2>"$LOG_DIR/${scope}_wt_err.log"; then
        echo "error: failed to create worktree for $scope" >&2
        cat "$LOG_DIR/${scope}_wt_err.log" >&2
        return 1
    fi

    # copy gitignored files needed in worktree
    if [ -f "$REPO_ROOT/.env.local" ]; then
        cp "$REPO_ROOT/.env.local" "$worktree/.env.local"
    fi
    # copy .claude/commands so slash commands work
    if [ -d "$REPO_ROOT/.claude/commands" ]; then
        mkdir -p "$worktree/.claude/commands"
        cp -r "$REPO_ROOT/.claude/commands/"* "$worktree/.claude/commands/" 2>/dev/null || true
    fi

    # symlink node_modules to avoid reinstall
    if [ ! -d "$worktree/node_modules" ]; then
        ln -s "$REPO_ROOT/node_modules" "$worktree/node_modules" 2>/dev/null || true
    fi

    # verify worktree branch
    local wt_branch
    wt_branch="$(git -C "$worktree" branch --show-current 2>/dev/null)"
    if [ "$wt_branch" != "$branch" ]; then
        echo "error: worktree on '$wt_branch', expected '$branch'" >&2
        git -C "$REPO_ROOT" worktree remove --force "$worktree" 2>/dev/null || true
        return 1
    fi

    tmux new-window -t "$TMUX_SESSION" -n "$scope" \
        "cd $worktree && claude --dangerously-skip-permissions --model sonnet -p '/autoresearch $scope $iterations' 2>&1 | tee $log_file; cd $REPO_ROOT && git worktree remove --force $worktree 2>/dev/null; echo ''; echo 'branch: $branch'; echo 'done: $scope'; sleep 5"

    echo "[$(date +%H:%M)] started: $scope -> $worktree (branch: $branch)"

    # wait for window to close
    while tmux list-windows -t "$TMUX_SESSION" -F '#{window_name}' 2>/dev/null | grep -qx "$scope"; do
        sleep 30
    done

    echo "[$(date +%H:%M)] finished: $scope"
}

merge_branches() {
    local merged=0
    local skipped=0
    local conflicted=0
    local branches_to_delete=()

    echo ""
    echo "-- MERGE PHASE -------------------------------------------------"

    local current_branch
    current_branch="$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null)"
    if [ "$current_branch" != "main" ]; then
        echo "warning: on '$current_branch', switching to main"
        git -C "$REPO_ROOT" checkout main 2>/dev/null || {
            echo "error: cannot checkout main" >&2
            return 1
        }
    fi

    for branch in $(git -C "$REPO_ROOT" branch --list 'autoresearch/*' | tr -d ' '); do
        local commit_count
        commit_count=$(git -C "$REPO_ROOT" log main.."$branch" --oneline 2>/dev/null | wc -l)

        if [ "$commit_count" -eq 0 ]; then
            skipped=$((skipped + 1))
            branches_to_delete+=("$branch")
            continue
        fi

        local scope
        scope=$(echo "$branch" | cut -d/ -f2)
        echo "  merging $branch ($commit_count commits)..."

        if git -C "$REPO_ROOT" merge --no-ff "$branch" -m "chore: merge autoresearch/$scope improvements" 2>/dev/null; then
            merged=$((merged + 1))
            branches_to_delete+=("$branch")
        else
            git -C "$REPO_ROOT" merge --abort 2>/dev/null || true
            echo "  CONFLICT: $branch -- skipping (needs manual merge)"
            conflicted=$((conflicted + 1))
        fi
    done

    for branch in "${branches_to_delete[@]}"; do
        git -C "$REPO_ROOT" branch -D "$branch" 2>/dev/null
    done

    echo ""
    echo "  merged: $merged  skipped: $skipped  conflicts: $conflicted"
    if [ "$conflicted" -gt 0 ]; then
        echo "  remaining branches need manual merge:"
        git -C "$REPO_ROOT" branch --list 'autoresearch/*' 2>/dev/null | sed 's/^/    /'
    fi
    echo "-----------------------------------------------------------------"
}

run_all() {
    local iterations="${1:-$ITERATIONS}"
    local succeeded=0
    local failed=0

    echo "================================================================="
    echo "  AUTORESEARCH: financial_tracker, ${#SCOPES[@]} scopes"
    echo "  started: $(date)"
    echo "================================================================="
    echo ""

    for scope in "${SCOPES[@]}"; do
        if run_scope "$scope" "$iterations"; then
            succeeded=$((succeeded + 1))
        else
            failed=$((failed + 1))
        fi
    done

    echo ""
    echo "================================================================="
    echo "  DONE: $succeeded ok, $failed failed -- $(date)"
    echo "================================================================="

    merge_branches
}

# ─────────────────────────────────────────────────────────────────────────────

find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true

case "${1:---all}" in
    --help|-h)
        echo "usage: ft_autoresearch.sh [scope|--list|--status|--kill|--merge] [iterations]"
        echo ""
        echo "  (no args)   run all scopes sequentially, then merge to main"
        echo "  <scope>     run one scope (no auto-merge)"
        echo "  --list      show all scopes"
        echo "  --status    show running windows + recent logs"
        echo "  --kill      kill autoresearch session"
        echo "  --merge     merge pending autoresearch branches to main"
        echo ""
        echo "env: AUTORESEARCH_TIMEOUT (default 30m), AUTORESEARCH_ITERATIONS (default 10)"
        ;;
    --list)    list_scopes ;;
    --status)  show_status ;;
    --kill)    kill_session ;;
    --merge)   merge_branches ;;
    --all)     run_all "${2:-$ITERATIONS}" ;;
    *)         run_scope "$1" "${2:-$ITERATIONS}" ;;
esac
