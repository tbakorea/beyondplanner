// Run from the repository root with swift scripts/render_boot_brand.swift.
import AVFoundation
import CoreGraphics
import CoreText
import Foundation
import ImageIO
import UniformTypeIdentifiers

let width = 1280
let height = 720
let frameRate: Int32 = 60
let duration = 3.2
let outputDirectory = URL(fileURLWithPath: CommandLine.arguments.dropFirst().first ?? "dashboard/assets/boot", isDirectory: true)
try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)
let movieURL = outputDirectory.appendingPathComponent("beyond-planner-intro-v2.mp4")
let posterURL = outputDirectory.appendingPathComponent("beyond-planner-intro-v2.jpg")
if FileManager.default.fileExists(atPath: movieURL.path) {
    try FileManager.default.removeItem(at: movieURL)
}

let forest = CGColor(red: 0.085, green: 0.205, blue: 0.165, alpha: 1)
let gold = CGColor(red: 0.67, green: 0.55, blue: 0.32, alpha: 1)
let paper = CGColor(red: 247 / 255, green: 245 / 255, blue: 239 / 255, alpha: 1)
let displayFont = CTFontCreateUIFontForLanguage(.emphasizedSystem, 170, nil)!
let detailFont = CTFontCreateUIFontForLanguage(.system, 31, nil)!

func textLine(_ text: String, font: CTFont, tracking: CGFloat = 0, color: CGColor = forest) -> CTLine {
    let attributes: [NSAttributedString.Key: Any] = [
        NSAttributedString.Key(kCTFontAttributeName as String): font,
        NSAttributedString.Key(kCTForegroundColorAttributeName as String): color,
        NSAttributedString.Key(kCTKernAttributeName as String): tracking,
    ]
    return CTLineCreateWithAttributedString(NSAttributedString(string: text, attributes: attributes))
}

func ease(_ start: Double, _ end: Double, _ time: Double) -> CGFloat {
    let value = max(0, min(1, (time - start) / (end - start)))
    return CGFloat(value * value * (3 - 2 * value))
}

func drawBrand(in context: CGContext, time: Double) {
    let canvas = CGRect(x: 0, y: 0, width: width, height: height)
    context.setFillColor(paper)
    context.fill(canvas)
    let phase = time / duration
    let exit = ease(2.64, duration, time)
    let arrival = ease(0, 0.76, time) * (1 - exit)
    let expansion = 1 - arrival
    let colors = [CGColor(red: 1, green: 0.993, blue: 0.97, alpha: 0.85), paper] as CFArray
    let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 1])!
    context.drawRadialGradient(gradient, startCenter: CGPoint(x: 640, y: 380), startRadius: 0,
                               endCenter: CGPoint(x: 640, y: 380), endRadius: 650, options: [.drawsAfterEndLocation])

    let letters = Array("BEYOND")
    let lines = letters.map { textLine(String($0), font: displayFont) }
    let advances = lines.map { CGFloat(CTLineGetTypographicBounds($0, nil, nil, nil)) }
    let tracking: CGFloat = 5 + 17 * expansion
    let wordWidth = advances.reduce(0, +) + tracking * CGFloat(letters.count - 1)
    var x = (CGFloat(width) - wordWidth) / 2
    let baseline: CGFloat = 355
    // One fine orbit resolves into the O's clock, rather than a loading spinner.
    let clockX = x + advances.prefix(3).reduce(0, +) + tracking * 3 + advances[3] / 2
    let clockCenter = CGPoint(x: clockX, y: baseline + CTFontGetCapHeight(displayFont) / 2)
    let orbitAngle = phase * 4 * .pi - .pi / 2
    if expansion > 0 {
        let radius = 70 + expansion * 106
        context.saveGState()
        context.setStrokeColor(gold)
        context.setLineWidth(1.2)
        context.setLineCap(.round)
        context.setAlpha(0.28 * expansion)
        context.addArc(center: clockCenter, radius: radius, startAngle: orbitAngle,
                       endAngle: orbitAngle + .pi * 1.45, clockwise: false)
        context.strokePath()
        context.setAlpha(0.6 * expansion)
        context.setFillColor(gold)
        context.fillEllipse(in: CGRect(x: clockCenter.x + cos(orbitAngle) * radius - 2,
                                      y: clockCenter.y + sin(orbitAngle) * radius - 2, width: 4, height: 4))
        context.restoreGState()
    }
    context.saveGState()
    for index in letters.indices {
        let resolved = ease(Double(index) * 0.035, 0.58 + Double(index) * 0.035, time) * (1 - exit)
        let lift = (1 - resolved) * (18 + CGFloat(index) * 3)
        context.setAlpha(0.62 + 0.38 * resolved)
        context.textPosition = CGPoint(x: x, y: baseline - lift)
        CTLineDraw(lines[index], context)
        if letters[index] == "O" {
            let center = CGPoint(x: x + advances[index] / 2, y: baseline + CTFontGetCapHeight(displayFont) / 2 - lift)
            let sweep = phase - sin(phase * 2 * .pi) / (2 * .pi)
            let angle = .pi / 2 - sweep * 4 * .pi
            context.setStrokeColor(gold)
            context.setLineWidth(2.2)
            context.setLineCap(.round)
            for tick in 0..<4 {
                let direction = Double(tick) * .pi / 2
                context.move(to: CGPoint(x: center.x + cos(direction) * 24, y: center.y + sin(direction) * 24))
                context.addLine(to: CGPoint(x: center.x + cos(direction) * 26, y: center.y + sin(direction) * 26))
            }
            context.strokePath()
            context.move(to: center)
            context.addLine(to: CGPoint(x: center.x + cos(angle) * 22, y: center.y + sin(angle) * 22))
            context.move(to: center)
            context.addLine(to: CGPoint(x: center.x + cos(.pi / 6) * 12,
                                        y: center.y + sin(.pi / 6) * 12))
            context.strokePath()
            context.setFillColor(gold)
            context.fillEllipse(in: CGRect(x: center.x - 2, y: center.y - 2, width: 4, height: 4))
        }
        x += advances[index] + tracking
    }
    context.restoreGState()

    let subtitleTracking = 17 + 10 * expansion
    let subtitle = textLine("PLANNER", font: detailFont, tracking: subtitleTracking)
    let subtitleWidth = CTLineGetTypographicBounds(subtitle, nil, nil, nil)
    context.setAlpha(0.42 + 0.4 * arrival)
    context.textPosition = CGPoint(x: (Double(width) - subtitleWidth) / 2 + subtitleTracking / 2, y: 275 - expansion * 10)
    CTLineDraw(subtitle, context)
    context.setAlpha(1)

    let rule = CGRect(x: 488, y: 232, width: 304, height: 1)
    context.setFillColor(CGColor(red: 0.71, green: 0.60, blue: 0.38, alpha: 0.22))
    context.fill(rule)
    let glint = CGRect(x: 488 + arrival * 262, y: 231.5, width: 42, height: 2)
    context.setFillColor(gold)
    context.addPath(CGPath(roundedRect: glint, cornerWidth: 1.5, cornerHeight: 1.5, transform: nil))
    context.fillPath()
}

let writer = try AVAssetWriter(outputURL: movieURL, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoColorPropertiesKey: [
        AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
        AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
        AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
    ],
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 650_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264BaselineAutoLevel,
        AVVideoExpectedSourceFrameRateKey: frameRate,
        AVVideoMaxKeyFrameIntervalKey: frameRate,
        AVVideoAllowFrameReorderingKey: false,
    ],
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
    kCVPixelBufferCGImageCompatibilityKey as String: true,
    kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
])
writer.add(input)
guard writer.startWriting() else { throw writer.error! }
writer.startSession(atSourceTime: .zero)
let frameCount = Int(duration * Double(frameRate))

for frame in 0..<frameCount {
    while !input.isReadyForMoreMediaData {
        if writer.status == .failed { throw writer.error! }
        Thread.sleep(forTimeInterval: 0.002)
    }
    var buffer: CVPixelBuffer?
    guard let pool = adaptor.pixelBufferPool,
          CVPixelBufferPoolCreatePixelBuffer(nil, pool, &buffer) == kCVReturnSuccess,
          let pixelBuffer = buffer else { fatalError("Unable to allocate a video frame") }
    CVPixelBufferLockBaseAddress(pixelBuffer, [])
    CVBufferSetAttachment(pixelBuffer, kCVImageBufferCGColorSpaceKey,
                          CGColorSpace(name: CGColorSpace.sRGB)!, .shouldPropagate)
    let context = CGContext(data: CVPixelBufferGetBaseAddress(pixelBuffer), width: width, height: height,
                            bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
                            space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
    drawBrand(in: context, time: Double(frame) / Double(frameRate))
    if frame == 0 {
        let destination = CGImageDestinationCreateWithURL(posterURL as CFURL, UTType.jpeg.identifier as CFString, 1, nil)!
        CGImageDestinationAddImage(destination, context.makeImage()!, [kCGImageDestinationLossyCompressionQuality: 0.9] as CFDictionary)
        guard CGImageDestinationFinalize(destination) else { fatalError("Unable to write the poster") }
    }
    CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
    guard adaptor.append(pixelBuffer, withPresentationTime: CMTime(value: Int64(frame), timescale: frameRate)) else {
        throw writer.error ?? NSError(domain: "BootVideo", code: 1)
    }
}
input.markAsFinished()
let finished = DispatchSemaphore(value: 0)
writer.finishWriting { finished.signal() }
guard finished.wait(timeout: .now() + 60) == .success, writer.status == .completed else {
    throw writer.error ?? NSError(domain: "BootVideo", code: 2)
}
for intermediate in try FileManager.default.contentsOfDirectory(at: outputDirectory, includingPropertiesForKeys: nil)
where intermediate.lastPathComponent.hasPrefix(movieURL.lastPathComponent + ".sb-") {
    try FileManager.default.removeItem(at: intermediate)
}
print("Rendered \(frameCount) silent frames at \(width)×\(height).")
print(movieURL.path)
print(posterURL.path)
