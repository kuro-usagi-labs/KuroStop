#!/usr/bin/swift

import Foundation
import Cocoa

func verifyScreenshot(path: String, minLightPct: Double = 60.0, maxBlackPct: Double = 20.0) -> Bool {
    let url = URL(fileURLWithPath: path)
    guard let imageSource = CGImageSourceCreateWithURL(url as CFURL, nil),
          let cgImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
        print("ERROR: Could not load image at path: \(path)")
        return false
    }

    let width = cgImage.width
    let height = cgImage.height
    let totalPixels = width * height

    guard let dataProvider = cgImage.dataProvider,
          let pixelData = dataProvider.data,
          let ptr = CFDataGetBytePtr(pixelData) else {
        print("ERROR: Could not read pixel buffer from: \(path)")
        return false
    }

    let bytesPerPixel = cgImage.bitsPerPixel / 8
    let bytesPerRow = cgImage.bytesPerRow

    var blackPixels = 0
    var lightPaperPixels = 0

    // Sample pixels across grid for performance and accuracy
    let sampleStep = 2 // Sample every 2nd pixel
    var sampledCount = 0

    for y in stride(from: 0, to: height, by: sampleStep) {
        let rowPtr = ptr + y * bytesPerRow
        for x in stride(from: 0, to: width, by: sampleStep) {
            let pixelPtr = rowPtr + x * bytesPerPixel
            let r = Int(pixelPtr[0])
            let g = Int(pixelPtr[1])
            let b = Int(pixelPtr[2])
            sampledCount += 1

            // Pure black / near black (status bar or black screen)
            if r < 18 && g < 18 && b < 18 {
                blackPixels += 1
            }
            // Light paper (#F2F3F0 is 242, 243, 240) and white cards
            else if r >= 210 && g >= 210 && b >= 205 {
                lightPaperPixels += 1
            }
        }
    }

    let blackRatio = (Double(blackPixels) / Double(sampledCount)) * 100.0
    let lightRatio = (Double(lightPaperPixels) / Double(sampledCount)) * 100.0

    print("=== Verification of \(url.lastPathComponent) (\(width)x\(height)) ===")
    print("Sampled Pixels: \(sampledCount)")
    print(String(format: "Solid/Near Black Pixels: %d (%.2f%%) [Threshold <= %.1f%%]", blackPixels, blackRatio, maxBlackPct))
    print(String(format: "Light Lembar Paper Pixels: %d (%.2f%%) [Threshold >= %.1f%%]", lightPaperPixels, lightRatio, minLightPct))

    if blackRatio > maxBlackPct {
        print(String(format: "CRITICAL FAILURE: Screenshot is dominated by black pixels (%.2f%% > %.1f%%). UI failed to render!", blackRatio, maxBlackPct))
        return false
    }

    if lightRatio < minLightPct {
        print(String(format: "CRITICAL FAILURE: Insufficient Lembar porcelain-paper pixels (%.2f%% < %.1f%%). View hierarchy incomplete!", lightRatio, minLightPct))
        return false
    }

    print("SUCCESS: Screenshot \(url.lastPathComponent) passed pixel integrity verification (Lembar theme rendered correctly).\n")
    return true
}

let args = CommandLine.arguments
if args.count < 2 {
    print("Usage: verify_screenshot_pixels.swift <screenshot_path> [min_light_pct] [max_black_pct]")
    exit(1)
}

let imagePath = args[1]
let minLight = args.count > 2 ? (Double(args[2]) ?? 60.0) : 60.0
let maxBlack = args.count > 3 ? (Double(args[3]) ?? 20.0) : 20.0

let ok = verifyScreenshot(path: imagePath, minLightPct: minLight, maxBlackPct: maxBlack)
exit(ok ? 0 : 1)
