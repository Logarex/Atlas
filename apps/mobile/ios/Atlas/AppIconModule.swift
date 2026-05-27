import Foundation
import UIKit
import React

@objc(AppIconModule)
class AppIconModule: NSObject {
  
  static func moduleName() -> String! {
    return "AppIconModule"
  }
  
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  var methodQueue: DispatchQueue {
    return DispatchQueue.main
  }
  
  @objc(setAlternateIconName:resolver:rejecter:)
  func setAlternateIconName(
    _ iconName: String?,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard UIApplication.shared.supportsAlternateIcons else {
      reject("NOT_SUPPORTED", "Alternate icons are not supported on this device.", nil)
      return
    }

    guard UIApplication.shared.applicationState == .active else {
      reject("APP_INACTIVE", "App icon changes require an active application.", nil)
      return
    }
    
    let currentIconName = UIApplication.shared.alternateIconName
    let targetIconName = (iconName == "" || iconName == nil) ? nil : iconName
    
    if currentIconName == targetIconName {
      resolve(currentIconName)
      return
    }
    
    UIApplication.shared.setAlternateIconName(targetIconName) { error in
      if let error = error {
        let nsError = error as NSError
        if nsError.code == NSUserCancelledError {
          reject("CANCELLED", error.localizedDescription, error)
        } else if nsError.code == Int(POSIXErrorCode.EIO.rawValue) {
          reject("ICON_UNAVAILABLE", error.localizedDescription, error)
        } else {
          reject("ERROR", error.localizedDescription, error)
        }
      } else {
        resolve(UIApplication.shared.alternateIconName)
      }
    }
  }
  
  @objc(getAlternateIconName:rejecter:)
  func getAlternateIconName(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(UIApplication.shared.alternateIconName)
  }
}
