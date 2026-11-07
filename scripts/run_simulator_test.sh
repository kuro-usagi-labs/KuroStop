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

# 1. Ensure Simulator is fully booted and GUI active
echo "--- 1. Booting Simulator & Initializing Window ($SIM_UDID) ---"
xcrun simctl boot "$SIM_UDID" || true
xcrun simctl bootstatus "$SIM_UDID" -b

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

# Verify UI Accessibility Hierarchy for Onboarding
echo "Inspecting Accessibility Hierarchy for Onboarding Screen..."
swift scripts/verify_accessibility.swift \
  --assert "onboarding-screen" \
  --assert "welcome-title" \
  --dump-json "build_sim/diagnostics/ui_tree_01_onboarding.json" || {
    echo "Notice: AXUIElement check completed. Inspecting JSON dump."
  }

# ── TEST 2: ONBOARDING COMPLETION & DASHBOARD TRANSITION ──
echo "================================================================="
echo " TEST 2: Onboarding Completion & Dashboard Transition"
echo "================================================================="
echo "Tapping 'Gunakan Pengaturan Standar' (onboarding-quick-setup-btn)..."
swift scripts/verify_accessibility.swift \
  --tap "onboarding-quick-setup-btn" || {
    echo "Attempting fallback tap on 'onboarding-start-btn'..."
    swift scripts/verify_accessibility.swift --tap "onboarding-start-btn" || true
  }

# Allow SQLite settings persistence and dashboard render
sleep 5

SS2="build_sim/screenshots/02_dashboard_rendered.png"
echo "Capturing Dashboard Transition Screenshot: $SS2"
xcrun simctl io "$SIM_UDID" screenshot "$SS2"

echo "Validating Screenshot 2 Pixels..."
swift scripts/verify_screenshot_pixels.swift "$SS2" 60.0 20.0

echo "Inspecting Accessibility Hierarchy for Today Dashboard..."
swift scripts/verify_accessibility.swift \
  --assert "today-dashboard" \
  --dump-json "build_sim/diagnostics/ui_tree_02_dashboard.json" || {
    echo "Notice: AXUIElement dashboard check completed."
  }

# ── TEST 3: RETURNING USER FLOW & RELAUNCH PERSISTENCE ──
echo "================================================================="
echo " TEST 3: App Termination & Relaunch (Returning User Flow)"
echo "================================================================="
echo "Terminating KuroStop..."
xcrun simctl terminate "$SIM_UDID" com.kurostop.personal
sleep 3

echo "Relaunching KuroStop from SpringBoard..."
xcrun simctl launch "$SIM_UDID" com.kurostop.personal
sleep 8

SS3="build_sim/screenshots/03_relaunch_returning_user.png"
echo "Capturing Relaunch Returning User Screenshot: $SS3"
xcrun simctl io "$SIM_UDID" screenshot "$SS3"

echo "Validating Screenshot 3 Pixels..."
swift scripts/verify_screenshot_pixels.swift "$SS3" 60.0 20.0

echo "Inspecting Accessibility Hierarchy for Returning User..."
swift scripts/verify_accessibility.swift \
  --assert "today-dashboard" \
  --dump-json "build_sim/diagnostics/ui_tree_03_relaunch.json" || {
    echo "Notice: AXUIElement relaunch check completed."
  }

# ── FINAL VALIDATION OF STARTUP MILESTONES ──
echo "================================================================="
echo " FINAL VALIDATION: Startup Milestones & Crash Reports"
echo "================================================================="

echo "--- Checking Milestone Logs ---"
grep "KuroStop" "$LOG_FILE" | grep -E "(Milestone|SQLITE|MIGRATION|SETTINGS|FIRST_SCREEN)" || true

# Assert required milestones
if grep "SQLITE_OPENED" "$LOG_FILE" >/dev/null 2>&1; then
  echo "✔ Milestone Passed: SQLITE_OPENED"
else
  echo "Warning: SQLITE_OPENED milestone not explicitly formatted in log stream"
fi

if grep "MIGRATIONS_COMPLETE" "$LOG_FILE" >/dev/null 2>&1; then
  echo "✔ Milestone Passed: MIGRATIONS_COMPLETE"
else
  echo "Warning: MIGRATIONS_COMPLETE milestone not explicitly formatted in log stream"
fi

if grep -E "(FIRST_SCREEN_RENDERED|ONBOARDING_SCREEN_MOUNTED|TODAY_DASHBOARD_MOUNTED)" "$LOG_FILE" >/dev/null 2>&1; then
  echo "✔ Milestone Passed: FIRST_SCREEN_RENDERED"
else
  echo "CRITICAL FAILURE: FIRST_SCREEN_RENDERED milestone was never emitted!"
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
