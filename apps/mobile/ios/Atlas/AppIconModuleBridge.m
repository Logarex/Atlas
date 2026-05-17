#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppIconModule, NSObject)

RCT_EXTERN_METHOD(setAlternateIconName:(NSString *)iconName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAlternateIconName:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
