package com.forkly

import android.app.Application
import android.content.pm.PackageManager
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.salesforce.marketingcloud.cdp.CdpConfig
import com.salesforce.marketingcloud.sfmcsdk.SFMCSdk
import com.salesforce.marketingcloud.sfmcsdk.SFMCSdkModuleConfig
import com.salesforce.marketingcloud.sfmcsdk.components.logging.LogLevel
import com.salesforce.marketingcloud.sfmcsdk.components.logging.LogListener
import com.salesforce.personalization.PersonalizationConfig

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)

    // The host app owns Salesforce Personalization SDK initialization.
    // There is no JS-side configure() — we bootstrap the native SDK here.
    initializePersonalizationSDK()
  }

  private fun initializePersonalizationSDK() {
    // Verbose logging during development. Use LogLevel.ERROR (or drive it from
    // JS via PersonalizationModule.setLogging) for production builds.
    SFMCSdk.setLogging(LogLevel.DEBUG, LogListener.AndroidLogger())

    // Read configuration from AndroidManifest.xml <meta-data> entries
    // (same keys used on iOS for parity).
    val metaData = packageManager
      .getApplicationInfo(packageName, PackageManager.GET_META_DATA)
      .metaData

    val appId = metaData.getString("com.salesforce.personalization.CDP_APP_ID").orEmpty()
    val endpoint = metaData.getString("com.salesforce.personalization.CDP_ENDPOINT").orEmpty()
    val dataspace = metaData.getString("com.salesforce.personalization.DATASPACE") ?: "default"
    val cdnUrl = metaData.getString("com.salesforce.personalization.CDN_URL")

    require(appId.isNotBlank() && !appId.startsWith("YOUR_")) {
      "Set com.salesforce.personalization.CDP_APP_ID in AndroidManifest.xml before running Forkly."
    }
    require(endpoint.isNotBlank() && !endpoint.startsWith("YOUR_")) {
      "Set com.salesforce.personalization.CDP_ENDPOINT in AndroidManifest.xml before running Forkly."
    }

    // Configure CDP. Forkly drives screen/lifecycle tracking explicitly through
    // the Events API, so the automatic collectors are left off.
    val cdpConfig = CdpConfig.Builder(this, appId, endpoint).build()

    // Configure Personalization.
    val p13nBuilder = PersonalizationConfig.Builder(this).dataspace(dataspace)
    if (!cdnUrl.isNullOrBlank() && !cdnUrl.startsWith("YOUR_")) {
      p13nBuilder.cdnUrl(cdnUrl)
    }
    val personalizationConfig = p13nBuilder.build()

    SFMCSdk.configure(this, SFMCSdkModuleConfig.build {
      personalizationModuleConfig = personalizationConfig
      cdpModuleConfig = cdpConfig
    }) {
      Log.d(TAG, "Module ${it::class.simpleName}: ${it.status}")
    }

    // Consent is intentionally NOT auto opt-in here. Forkly drives consent from
    // the Account tab (PersonalizationModule.setConsent), so the unset →
    // opt-in / opt-out transitions are observable at runtime.
    Log.d(TAG, "SFMC SDK configured; consent left to manual control from the app UI")
  }

  companion object {
    private const val TAG = "Forkly"
  }
}
