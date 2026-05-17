import Foundation
import UIKit
import React

@objc(AppIconModule)
class AppIconModule: NSObject, RCTBridgeModule {
  
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
    
    let currentIconName = UIApplication.shared.alternateIconName
    let targetIconName = (iconName == "" || iconName == nil) ? nil : iconName
    
    if currentIconName == targetIconName {
      resolve(currentIconName)
      return
    }
    
    UIApplication.shared.setAlternateIconName(targetIconName) { error in
      if let error = error {
        reject("ERROR", error.localizedDescription, error)
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
