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
let movieURL = outputDirectory.appendingPathComponent("beyond-planner-intro-v3.mp4")
let posterURL = outputDirectory.appendingPathComponent("beyond-planner-intro-v3.jpg")
if FileManager.default.fileExists(atPath: movieURL.path) {
    try FileManager.default.removeItem(at: movieURL)
}

let forest = CGColor(red: 0.055, green: 0.13, blue: 0.105, alpha: 1)
let gold = CGColor(red: 0.86, green: 0.73, blue: 0.46, alpha: 1)
let paper = CGColor(red: 0.97, green: 0.96, blue: 0.91, alpha: 1)
let displayFont = CTFontCreateUIFontForLanguage(.emphasizedSystem, 196, nil)!
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
    context.setFillColor(forest)
    context.fill(canvas)
    let phase = time / duration
    let exit = ease(2.64, duration, time)
    let arrival = ease(0, 0.76, time) * (1 - exit)
    let expansion = 1 - arrival
    let colors = [CGColor(red: 0.12, green: 0.25, blue: 0.19, alpha: 1), forest] as CFArray
    let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 1])!
    context.drawRadialGradient(gradient, startCenter: CGPoint(x: 640, y: 380), startRadius: 0,
                               endCenter: CGPoint(x: 640, y: 380), endRadius: 650, options: [.drawsAfterEndLocation])

    let letters = Array("BEYOND")
    let lines = letters.map { textLine(String($0), font: displayFont) }
    let advances = lines.map { CGFloat(CTLineGetTypographicBounds($0, nil, nil, nil)) }
    context.saveGState()
    let camera = 0.9 + ease(0, 0.5, time) * 0.13 - ease(0.5, 0.95, time) * 0.03 - exit * 0.1
    context.translateBy(x: 640, y: 360)
    context.scaleBy(x: camera, y: camera)
    context.translateBy(x: -640, y: -360)
    let tracking: CGFloat = 3 + 20 * expansion
    let wordWidth = advances.reduce(0, +) + tracking * CGFloat(letters.count - 1)
    var x = (CGFloat(width) - wordWidth) / 2
    let baseline: CGFloat = 350
    // One fine orbit resolves into the O's clock, rather than a loading spinner.
    let clockX = x + advances.prefix(3).reduce(0, +) + tracking * 3 + advances[3] / 2
    let clockCenter = CGPoint(x: clockX, y: baseline + CTFontGetCapHeight(displayFont) / 2)
    let orbitAngle = phase * 4 * .pi - .pi / 2
    if expansion > 0 {
        let radius = 76 + expansion * 125
        context.saveGState()
        context.setStrokeColor(gold)
        context.setLineWidth(2)
        context.setLineCap(.round)
        context.setAlpha(0.62 * expansion)
        context.addArc(center: clockCenter, radius: radius, startAngle: orbitAngle,
                       endAngle: orbitAngle + .pi * 1.45, clockwise: false)
        context.strokePath()
        context.setAlpha(expansion)
        context.setFillColor(gold)
        context.fillEllipse(in: CGRect(x: clockCenter.x + cos(orbitAngle) * radius - 2,
                                      y: clockCenter.y + sin(orbitAngle) * radius - 2, width: 4, height: 4))
        context.restoreGState()
    }
    let wordPath = CGMutablePath()
    var dialCenter = clockCenter
    for index in letters.indices {
        let resolved = ease(Double(index) * 0.035, 0.58 + Double(index) * 0.035, time) * (1 - exit)
        let lift = (1 - resolved) * (34 + CGFloat(index) * 4)
        var character = String(letters[index]).utf16.first!
        var glyph: CGGlyph = 0
        CTFontGetGlyphsForCharacters(displayFont, &character, &glyph, 1)
        if let outline = CTFontCreatePathForGlyph(displayFont, glyph, nil) {
            wordPath.addPath(outline, transform: CGAffineTransform(translationX: x, y: baseline - lift))
        }
        if letters[index] == "O" {
            dialCenter = CGPoint(x: x + advances[index] / 2, y: baseline + CTFontGetCapHeight(displayFont) / 2 - lift)
        }
        x += advances[index] + tracking
    }
    context.saveGState()
    context.setShadow(offset: CGSize(width: 0, height: -5), blur: 14,
                      color: CGColor(red: 0, green: 0, blue: 0, alpha: 0.3))
    context.setFillColor(paper)
    context.addPath(wordPath)
    context.fillPath()
    context.restoreGState()
    // A narrow metallic light pass is clipped to the letter outlines.
    context.saveGState()
    context.addPath(wordPath)
    context.clip()
    let lightX = -240 + ease(0.08, 1.35, time) * 1760 - exit * 1760
    let clearGold = CGColor(red: 0.86, green: 0.73, blue: 0.46, alpha: 0)
    let highlight = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                               colors: [clearGold, gold, clearGold] as CFArray, locations: [0, 0.5, 1])!
    context.drawLinearGradient(highlight, start: CGPoint(x: lightX - 120, y: 290),
                               end: CGPoint(x: lightX + 120, y: 520), options: [])
    context.restoreGState()
    let sweep = phase - sin(phase * 2 * .pi) / (2 * .pi)
    let angle = .pi / 2 - sweep * 4 * .pi
    context.setStrokeColor(gold)
    context.setLineWidth(2.6)
    context.setLineCap(.round)
    for tick in 0..<4 {
        let direction = Double(tick) * .pi / 2
        context.move(to: CGPoint(x: dialCenter.x + cos(direction) * 27, y: dialCenter.y + sin(direction) * 27))
        context.addLine(to: CGPoint(x: dialCenter.x + cos(direction) * 30, y: dialCenter.y + sin(direction) * 30))
    }
    context.strokePath()
    context.move(to: dialCenter)
    context.addLine(to: CGPoint(x: dialCenter.x + cos(angle) * 25, y: dialCenter.y + sin(angle) * 25))
    context.move(to: dialCenter)
    context.addLine(to: CGPoint(x: dialCenter.x + cos(.pi / 6) * 14, y: dialCenter.y + sin(.pi / 6) * 14))
    context.strokePath()
    context.setFillColor(gold)
    context.fillEllipse(in: CGRect(x: dialCenter.x - 2.5, y: dialCenter.y - 2.5, width: 5, height: 5))

    let subtitleTracking = 17 + 10 * expansion
    let subtitle = textLine("PLANNER", font: detailFont, tracking: subtitleTracking, color: paper)
    let subtitleWidth = CTLineGetTypographicBounds(subtitle, nil, nil, nil)
    context.setAlpha(0.75 + 0.25 * arrival)
    context.textPosition = CGPoint(x: (Double(width) - subtitleWidth) / 2 + subtitleTracking / 2, y: 255 - expansion * 10)
    CTLineDraw(subtitle, context)
    context.setAlpha(1)

    let rule = CGRect(x: 448, y: 210, width: 384, height: 1)
    context.setFillColor(CGColor(red: 0.86, green: 0.73, blue: 0.46, alpha: 0.4))
    context.fill(rule)
    let glint = CGRect(x: 448 + arrival * 324, y: 209, width: 60, height: 3)
    context.setFillColor(gold)
    context.addPath(CGPath(roundedRect: glint, cornerWidth: 1.5, cornerHeight: 1.5, transform: nil))
    context.fillPath()
    context.restoreGState()
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
        AVVideoAverageBitRateKey: 900_000,
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
