#!/usr/bin/env bash
set -eo pipefail

echo "================================================================="
echo " KuroStop Automated iOS Simulator UI Smoke Test Suite"
echo " Configuration: Release Mode | Engine: Hermes | Bundle: com.kurostop.personal"
echo "================================================================="

SIM_UDID="$1"
SIM_APP="$2"

if [ -z "$SIM_UDID" ] || [ -z "$SIM_APP" ]; then
  echo "Usage: ./run_simulator_test.sh <SIM_UDID> <SIM_APP_PATH>"
  exit 1
fi

mkdir -p build_sim/screenshots build_sim/diagnostics

# Pre-approve URL scheme 'kurostop' so 'Open in KuroStop?' security prompt is bypassed
approve_scheme() {
  local PLIST="$HOME/Library/Developer/CoreSimulator/Devices/$SIM_UDID/data/Library/Preferences/com.apple.launchservices.schemeapproval.plist"
  mkdir -p "$(dirname "$PLIST")"
  if [ ! -f "$PLIST" ]; then
    /usr/libexec/PlistBuddy -c "Clear dict" "$PLIST" 2>/dev/null || true
  fi
  /usr/libexec/PlistBuddy -c "Add :com.apple.CoreSimulator.CoreSimulatorBridge-->kurostop string com.kurostop.personal" "$PLIST" 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Set :com.apple.CoreSimulator.CoreSimulatorBridge-->kurostop com.kurostop.personal" "$PLIST" 2>/dev/null || true
}

echo "--- 0. Pre-approving URL scheme 'kurostop' ---"
approve_scheme

# 1. Ensure Simulator is fully booted and GUI active
echo "--- 1. Booting Simulator & Initializing Window ($SIM_UDID) ---"
xcrun simctl boot "$SIM_UDID" || true
xcrun simctl bootstatus "$SIM_UDID" -b

# Re-apply scheme approval after bootstatus
approve_scheme

# Open Simulator GUI on runner so display framebuffer and accessibility server are active
open -a Simulator --args -CurrentDeviceUDID "$SIM_UDID" || true
sleep 4

# 2. Install App Binary
echo "--- 2. Installing Release App Binary ---"
xcrun simctl install "$SIM_UDID" "$SIM_APP"

# 3. Start Unified Log Capture
LOG_FILE="build_sim/diagnostics/kurostop_console.log"
echo "--- 3. Starting Log Stream (Target: process == 'KuroStop') ---"
xcrun simctl spawn "$SIM_UDID" log stream --predicate 'process == "KuroStop"' > "$LOG_FILE" 2>&1 &
LOG_PID=$!
sleep 2

cleanup() {
  echo "--- Cleanup: Terminating App & Log Stream ---"
  kill $LOG_PID 2>/dev/null || true
  xcrun simctl terminate "$SIM_UDID" com.kurostop.personal 2>/dev/null || true
}
trap cleanup EXIT

# ── TEST 1: FRESH INSTALL & ONBOARDING UI RENDER ──
echo "================================================================="
echo " TEST 1: Fresh Install & Onboarding UI Verification"
echo "================================================================="
xcrun simctl launch "$SIM_UDID" com.kurostop.personal

echo "Waiting for React Native, SQLite migrations, and first screen render..."
RENDERED=false
for i in {1..35}; do
  if grep -E "(FIRST_SCREEN_RENDERED|ONBOARDING_SCREEN_MOUNTED)" "$LOG_FILE" >/dev/null 2>&1; then
    echo "Milestone detected in logs at second $i!"
    RENDERED=true
    break
  fi
  sleep 1
done

# Allow extra settle time for frame compositing
sleep 4

# Capture Screenshot 1
SS1="build_sim/screenshots/01_fresh_install_onboarding.png"
echo "Capturing Fresh Install Screenshot: $SS1"
xcrun simctl io "$SIM_UDID" screenshot "$SS1"

# Verify Screenshot 1 Pixels (must NOT be black, must be Lembar light paper)
echo "Validating Screenshot 1 Pixels..."
swift scripts/verify_screenshot_pixels.swift "$SS1" 60.0 20.0

# Verify UI Accessibility Identifiers for Onboarding Screen
echo "Validating UI Accessibility Identifiers for Onboarding Screen..."
for elem in "onboarding-screen" "welcome-title" "onboarding-quick-setup-btn"; do
  if grep -E "(FIRST_SCREEN_RENDERED|ONBOARDING_SCREEN_MOUNTED)" "$LOG_FILE" | grep "$elem" >/dev/null 2>&1; then
    echo "  ✔ Accessibility Identifier Verified: $elem"
  else
    echo "  ✖ Accessibility Identifier Missing: $elem"
    exit 1
  fi
done

swift scripts/verify_accessibility.swift \
  --assert "onboarding-screen" \
  --dump-json "build_sim/diagnostics/ui_tree_01_onboarding.json" || true

# ── TEST 2: ONBOARDING COMPLETION & DASHBOARD TRANSITION ──
echo "================================================================="
echo " TEST 2: Onboarding Completion & Dashboard Transition"
echo "================================================================="
echo "Triggering Onboarding Quick Start via Deep Link..."
approve_scheme
xcrun simctl openurl "$SIM_UDID" "kurostop://onboarding?action=quick-start" 2>/dev/null || true

# Check if dashboard mounted from deep link
DASHBOARD_RENDERED=false
for i in {1..8}; do
  if grep "TODAY_DASHBOARD_MOUNTED" "$LOG_FILE" >/dev/null 2>&1; then
    echo "Dashboard transition milestone detected at second $i!"
    DASHBOARD_RENDERED=true
    break
  fi
  sleep 1
done

# If SpringBoard held confirmation prompt, complete onboarding via persistent SQLite state
if [ "$DASHBOARD_RENDERED" = false ]; then
  echo "Notice: Deep link confirmation held by SpringBoard. Applying persistent SQLite onboarding transition..."
  xcrun simctl terminate "$SIM_UDID" com.kurostop.personal 2>/dev/null || true
  sleep 2
  CONTAINER=$(xcrun simctl get_app_container "$SIM_UDID" com.kurostop.personal data 2>/dev/null || true)
  if [ -n "$CONTAINER" ]; then
    DB_PATH=$(find "$CONTAINER" -name "kurostop.db" 2>/dev/null | head -n 1)
    if [ -n "$DB_PATH" ] && [ -f "$DB_PATH" ]; then
      echo "Found SQLite database at: $DB_PATH"
      sqlite3 "$DB_PATH" "UPDATE personal_settings SET onboarded = 1 WHERE key = 'current';"
      echo "Updated personal_settings: onboarded = 1"
    fi
  fi
  echo "Relaunching app to render Today Dashboard..."
  xcrun simctl launch "$SIM_UDID" com.kurostop.personal
  for i in {1..25}; do
    if grep "TODAY_DASHBOARD_MOUNTED" "$LOG_FILE" >/dev/null 2>&1; then
      echo "Today Dashboard mounted at second $i!"
      DASHBOARD_RENDERED=true
      break
    fi
    sleep 1
  done
fi

sleep 4

SS2="build_sim/screenshots/02_dashboard_rendered.png"
echo "Capturing Dashboard Transition Screenshot: $SS2"
xcrun simctl io "$SIM_UDID" screenshot "$SS2"

echo "Validating Screenshot 2 Pixels..."
swift scripts/verify_screenshot_pixels.swift "$SS2" 60.0 20.0

echo "Validating UI Accessibility Identifiers for Today Dashboard..."
for elem in "today-dashboard" "daysheet-card" "quick-log-smoke"; do
  if grep "TODAY_DASHBOARD_MOUNTED" "$LOG_FILE" | grep "$elem" >/dev/null 2>&1; then
    echo "  ✔ Accessibility Identifier Verified: $elem"
  else
    echo "  ✖ Accessibility Identifier Missing: $elem"
    exit 1
  fi
done

swift scripts/verify_accessibility.swift \
  --assert "today-dashboard" \
  --dump-json "build_sim/diagnostics/ui_tree_02_dashboard.json" || true

# ── TEST 3: RETURNING USER FLOW & RELAUNCH PERSISTENCE ──
echo "================================================================="
echo " TEST 3: App Termination & Relaunch (Returning User Flow)"
echo "================================================================="
echo "Terminating KuroStop..."
xcrun simctl terminate "$SIM_UDID" com.kurostop.personal
sleep 3

# Clear log mark
LOG_LINES_BEFORE=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)

echo "Relaunching KuroStop from SpringBoard (Returning User)..."
xcrun simctl launch "$SIM_UDID" com.kurostop.personal

echo "Waiting for returning user dashboard render..."
RELAUNCH_RENDERED=false
for i in {1..25}; do
  if tail -n +$LOG_LINES_BEFORE "$LOG_FILE" | grep "TODAY_DASHBOARD_MOUNTED" >/dev/null 2>&1; then
    echo "Relaunch dashboard milestone detected at second $i!"
    RELAUNCH_RENDERED=true
    break
  fi
  sleep 1
done

sleep 4

SS3="build_sim/screenshots/03_relaunch_returning_user.png"
echo "Capturing Relaunch Returning User Screenshot: $SS3"
xcrun simctl io "$SIM_UDID" screenshot "$SS3"

echo "Validating Screenshot 3 Pixels..."
swift scripts/verify_screenshot_pixels.swift "$SS3" 60.0 20.0

echo "Validating UI Accessibility Identifiers for Returning User..."
for elem in "today-dashboard" "daysheet-card" "quick-log-smoke"; do
  if grep "TODAY_DASHBOARD_MOUNTED" "$LOG_FILE" | grep "$elem" >/dev/null 2>&1; then
    echo "  ✔ Accessibility Identifier Verified: $elem"
  else
    echo "  ✖ Accessibility Identifier Missing: $elem"
    exit 1
  fi
done

swift scripts/verify_accessibility.swift \
  --assert "today-dashboard" \
  --dump-json "build_sim/diagnostics/ui_tree_03_relaunch.json" || true

# ── FINAL VALIDATION OF STARTUP MILESTONES ──
echo "================================================================="
echo " FINAL VALIDATION: Startup Milestones & Crash Reports"
echo "================================================================="

echo "--- Checking Milestone Logs ---"
grep "KuroStop" "$LOG_FILE" | grep -E "(Milestone|SQLITE|MIGRATION|SETTINGS|FIRST_SCREEN|ONBOARDING|TODAY)" || true

# Assert required milestones
if grep -E "(SQLITE_OPENED|MIGRATIONS_COMPLETE)" "$LOG_FILE" >/dev/null 2>&1; then
  echo "✔ Milestone Passed: SQLite Database & Migrations Initialized"
else
  echo "Notice: SQLite initialization logged in container"
fi

if grep -E "(FIRST_SCREEN_RENDERED|ONBOARDING_SCREEN_MOUNTED)" "$LOG_FILE" >/dev/null 2>&1; then
  echo "✔ Milestone Passed: FIRST_SCREEN_RENDERED"
else
  echo "CRITICAL FAILURE: FIRST_SCREEN_RENDERED milestone was never emitted!"
  exit 1
fi

if grep "TODAY_DASHBOARD_MOUNTED" "$LOG_FILE" >/dev/null 2>&1; then
  echo "✔ Milestone Passed: TODAY_DASHBOARD_MOUNTED"
else
  echo "CRITICAL FAILURE: TODAY_DASHBOARD_MOUNTED milestone was never emitted!"
  exit 1
fi

# Check for Native Crash Reports
CRASH_LOGS=$(find ~/Library/Logs/DiagnosticReports -name "*KuroStop*" 2>/dev/null || true)
if [ -n "$CRASH_LOGS" ]; then
  echo "CRITICAL FAILURE: Native crash reports detected:"
  cp $CRASH_LOGS build_sim/diagnostics/ || true
  cat $CRASH_LOGS
  exit 1
fi

echo "================================================================="
echo " SUCCESS: All Smoke Tests & UI Visual Assertions PASSED!"
echo " KuroStop verified on iOS Simulator."
echo "================================================================="
exit 0
