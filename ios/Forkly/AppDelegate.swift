import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import SFMCSDK
import Cdp
import Personalization

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // The host app owns Salesforce Personalization SDK initialization.
    // There is no JS-side configure() — we bootstrap the native SDK here,
    // before React Native starts, so ContentZones can fetch immediately.
    initializePersonalizationSDK()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Forkly",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // MARK: - Salesforce Personalization SDK Initialization

  private func initializePersonalizationSDK() {
    // Verbose logging during development. Use .error (or drive it from JS via
    // PersonalizationModule.setLogging) for production builds.
    SFMCSdk.setLogger(logLevel: .debug)

    // Read configuration from Info.plist (same keys used on Android for parity).
    let info = Bundle.main.infoDictionary ?? [:]
    let appId = info["com.salesforce.personalization.CDP_APP_ID"] as? String ?? ""
    let endpoint = info["com.salesforce.personalization.CDP_ENDPOINT"] as? String ?? ""
    let dataspace = (info["com.salesforce.personalization.DATASPACE"] as? String) ?? "default"
    let cdnUrl = info["com.salesforce.personalization.CDN_URL"] as? String

    precondition(
      !appId.isEmpty && !appId.hasPrefix("YOUR_"),
      "Set com.salesforce.personalization.CDP_APP_ID in Info.plist before running Forkly."
    )
    precondition(
      !endpoint.isEmpty && !endpoint.hasPrefix("YOUR_"),
      "Set com.salesforce.personalization.CDP_ENDPOINT in Info.plist before running Forkly."
    )

    // Configure CDP. Forkly drives screen/lifecycle tracking explicitly through
    // the Events API, so the automatic collectors are left off.
    let cdpConfig = CdpConfigBuilder(appId: appId, endpoint: endpoint)
      .eventFlushRate(EventFlushRateQuantity(quantity: 1))
      .trackScreens(false)
      .trackLifecycle(false)
      .build()

    // Configure Personalization.
    let p13nBuilder = PersonalizationConfigBuilder().dataspace(dataspace)
    if let cdnUrl = cdnUrl, !cdnUrl.isEmpty, !cdnUrl.hasPrefix("YOUR_") {
      _ = p13nBuilder.cdnUrl(cdnUrl)
    }
    let personalizationConfig = p13nBuilder.build()

    let sdkConfig = ConfigBuilder()
      .setCdp(config: cdpConfig)
      .setPersonalization(config: personalizationConfig)
      .build()

    SFMCSdk.initializeSdk(sdkConfig) { statuses in
      statuses.forEach { status in
        if status.initStatus == .success {
          print("✅ Module \(status.moduleName.rawValue) initialized successfully")
        } else {
          print("❌ Module \(status.moduleName.rawValue) failed: \(status.initStatus.rawValue)")
        }
      }
      // Consent is intentionally NOT auto opt-in here. Forkly drives consent from
      // the Account tab (PersonalizationModule.setConsent), so the unset →
      // opt-in / opt-out transitions are observable at runtime.
    }
  }

  // MARK: - Deep Link Handling (Personalization preview)

  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
