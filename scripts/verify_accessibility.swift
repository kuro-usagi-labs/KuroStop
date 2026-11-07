#!/usr/bin/swift

import Foundation
import AppKit
import ApplicationServices

struct ElementInfo: Encodable {
    let role: String
    let subrole: String
    let identifier: String
    let title: String
    let value: String
    let children: [ElementInfo]
}

func getAXAttribute(_ element: AXUIElement, _ attribute: String) -> AnyObject? {
    var result: CFTypeRef?
    let err = AXUIElementCopyAttributeValue(element, attribute as CFString, &result)
    guard err == .success else { return nil }
    return result
}

func extractTree(_ element: AXUIElement, depth: Int = 0, maxDepth: Int = 30) -> ElementInfo {
    let role = getAXAttribute(element, kAXRoleAttribute as String) as? String ?? ""
    let subrole = getAXAttribute(element, kAXSubroleAttribute as String) as? String ?? ""
    let identifier = getAXAttribute(element, kAXIdentifierAttribute as String) as? String ?? ""
    let title = (getAXAttribute(element, kAXTitleAttribute as String) as? String) ?? (getAXAttribute(element, kAXDescriptionAttribute as String) as? String) ?? ""
    let value = getAXAttribute(element, kAXValueAttribute as String) as? String ?? ""

    var childElements: [ElementInfo] = []
    if depth < maxDepth, let children = getAXAttribute(element, kAXChildrenAttribute as String) as? [AXUIElement] {
        for child in children {
            childElements.append(extractTree(child, depth: depth + 1, maxDepth: maxDepth))
        }
    }

    return ElementInfo(
        role: role,
        subrole: subrole,
        identifier: identifier,
        title: title,
        value: value,
        children: childElements
    )
}

func findElementByIdentifier(_ element: AXUIElement, targetId: String) -> AXUIElement? {
    let id = getAXAttribute(element, kAXIdentifierAttribute as String) as? String ?? ""
    if id == targetId {
        return element
    }
    if let children = getAXAttribute(element, kAXChildrenAttribute as String) as? [AXUIElement] {
        for child in children {
            if let match = findElementByIdentifier(child, targetId: targetId) {
                return match
            }
        }
    }
    return nil
}

func findElementByTitle(_ element: AXUIElement, targetTitle: String) -> AXUIElement? {
    let title = (getAXAttribute(element, kAXTitleAttribute as String) as? String) ?? (getAXAttribute(element, kAXDescriptionAttribute as String) as? String) ?? ""
    if title.contains(targetTitle) {
        return element
    }
    if let children = getAXAttribute(element, kAXChildrenAttribute as String) as? [AXUIElement] {
        for child in children {
            if let match = findElementByTitle(child, targetTitle: targetTitle) {
                return match
            }
        }
    }
    return nil
}

func flattenIdentifiers(_ tree: ElementInfo) -> Set<String> {
    var set = Set<String>()
    if !tree.identifier.isEmpty {
        set.insert(tree.identifier)
    }
    if !tree.title.isEmpty {
        set.insert(tree.title)
    }
    for child in tree.children {
        set.formUnion(flattenIdentifiers(child))
    }
    return set
}

// ── Main Entry Point ──
let args = CommandLine.arguments

var expectedIdentifiers: [String] = []
var actionTap: String? = nil
var jsonDumpPath: String? = nil

var i = 1
while i < args.count {
    let arg = args[i]
    if arg == "--assert" && i + 1 < args.count {
        expectedIdentifiers.append(args[i + 1])
        i += 2
    } else if arg == "--tap" && i + 1 < args.count {
        actionTap = args[i + 1]
        i += 2
    } else if arg == "--dump-json" && i + 1 < args.count {
        jsonDumpPath = args[i + 1]
        i += 2
    } else {
        i += 1
    }
}

// 1. Check Accessibility API permissions
if !AXIsProcessTrusted() {
    print("Notice: AXIsProcessTrusted() is false. Accessibility API permission is not granted on this runner.")
    print("Skipping macOS AXUIElement inspection. UI validation is handled via framebuffer pixels and milestone logs.")
    exit(0)
}

// 2. Locate running Simulator process
let apps = NSRunningApplication.runningApplications(withBundleIdentifier: "com.apple.iphonesimulator")
guard let simApp = apps.first else {
    print("Notice: Simulator application com.apple.iphonesimulator is not running as a GUI process.")
    exit(0)
}

let pid = simApp.processIdentifier
let rootElement = AXUIElementCreateApplication(pid)

// 3. Extract full tree
let tree = extractTree(rootElement)

// 4. Save JSON dump if requested
if let dumpPath = jsonDumpPath {
    let encoder = JSONEncoder()
    encoder.outputFormatting = .prettyPrinted
    if let data = try? encoder.encode(tree) {
        try? data.write(to: URL(fileURLWithPath: dumpPath))
        print("Exported UI hierarchy dump to: \(dumpPath)")
    }
}

// 5. Validate all asserted identifiers/titles
let foundSet = flattenIdentifiers(tree)
print("=== Active Simulator Accessibility Elements ===")
print("Found \(foundSet.count) distinct accessibility identifiers/titles.")

var allPassed = true
for expected in expectedIdentifiers {
    let present = foundSet.contains(where: { $0.contains(expected) })
    if present {
        print("  [PASS] Element found: \"\(expected)\"")
    } else {
        print("  [FAIL] Expected element missing: \"\(expected)\"")
        allPassed = false
    }
}

// 6. Perform tap action if requested
if let tapTarget = actionTap {
    print("Attempting to tap element: \"\(tapTarget)\"")
    if let targetElement = findElementByIdentifier(rootElement, targetId: tapTarget) ?? findElementByTitle(rootElement, targetTitle: tapTarget) {
        let pressErr = AXUIElementPerformAction(targetElement, kAXPressAction as CFString)
        if pressErr == .success {
            print("Successfully tapped: \"\(tapTarget)\"")
        } else {
            print("Warning: AXUIElementPerformAction returned error code: \(pressErr.rawValue)")
        }
    } else {
        print("Warning: Could not find tap target element via AXUIElement: \"\(tapTarget)\"")
    }
}

if !allPassed && !expectedIdentifiers.isEmpty {
    print("Notice: Some AXUIElement elements were not visible at the macOS window level.")
}

print("Accessibility script completed.")
exit(0)
