package com.aabha.reader

import android.app.Activity
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Content
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File


class MainActivity : Activity() {

    private lateinit var web: WebView
    private val scope = CoroutineScope(Dispatchers.Main)

    private var engine: Engine? = null
    private var conversation: Conversation? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        web = WebView(this).apply {

            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true

            // Allow HTTPS content and WebSocket communication.
            settings.mixedContentMode =
                android.webkit.WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE

            webViewClient = object : WebViewClient() {

                override fun onPageFinished(
                    view: WebView?,
                    url: String?
                ) {
                    super.onPageFinished(view, url)
                      // add comment for display if you want
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: android.webkit.WebResourceRequest?,
                    error: android.webkit.WebResourceError?
                ) {
                    super.onReceivedError(
                        view,
                        request,
                        error
                    )

                    if (request?.isForMainFrame == true) {
                        showStatus(
                            "READER LOAD FAILED: ${error?.description}"
                        )
                    }
                }
            }

            addJavascriptInterface(
                GemmaBridge(),
                "GemmaBridge"
            )
        }

        setContentView(web)

        // showStatus("SEARCHING FOR READER...")

        discoverReader()

        initialiseGemma()
    }

    private fun discoverReader() {

        // Public Reader server exposed through ngrok.
        // Do NOT add :8787 here — ngrok handles the external HTTPS connection.
        val readerUrl =
            "https://debatable-casino-lent.ngrok-free.dev/phone/index.html"

       // showStatus("CONNECTING TO READER...")

        runOnUiThread {

            web.loadUrl(readerUrl)

           // showStatus("READER CONNECTING...")
        }
    }
    private fun showStatus(message: String) {
        runOnUiThread {
            Toast.makeText(
                this,
                message,
                Toast.LENGTH_LONG
            ).show()
        }
    }

    private fun initialiseGemma() {
        scope.launch(Dispatchers.IO) {

            showStatus("GEMMA: STARTING")

            try {
                val model = File(
                    filesDir,
                    "gemma-4-E2B-it.litertlm"
                )

                val externalModel = File(
                    getExternalFilesDir(null),
                    "gemma-4-E2B-it.litertlm"
                )

                showStatus(
                    "GEMMA: CHECKING FILES\n" +
                            "PRIVATE: ${model.exists()}\n" +
                            "EXTERNAL: ${externalModel.exists()}"
                )

                android.util.Log.d(
                    "READER_GEMMA",
                    "Private model: ${model.absolutePath}"
                )

                android.util.Log.d(
                    "READER_GEMMA",
                    "Private exists: ${model.exists()}"
                )

                android.util.Log.d(
                    "READER_GEMMA",
                    "External model: ${externalModel.absolutePath}"
                )

                android.util.Log.d(
                    "READER_GEMMA",
                    "External exists: ${externalModel.exists()}"
                )

                if (!model.exists()) {

                    if (externalModel.exists()) {

                        showStatus("GEMMA: COPYING MODEL")

                        externalModel.inputStream().use { input ->
                            model.outputStream().use { output ->
                                input.copyTo(output)
                            }
                        }

                        android.util.Log.d(
                            "READER_GEMMA",
                            "Model copied. Size=${model.length()}"
                        )

                    } else {

                        android.util.Log.e(
                            "READER_GEMMA",
                            "MODEL NOT FOUND"
                        )

                        showStatus("GEMMA: MODEL NOT FOUND")
                        return@launch
                    }
                }

                showStatus(
                    "GEMMA: MODEL READY\n" +
                            "${model.length() / (1024 * 1024)} MB"
                )

                android.util.Log.d(
                    "READER_GEMMA",
                    "Starting LiteRT initialization"
                )

                showStatus("GEMMA: INITIALIZING LITERT")

                val config = EngineConfig(
                    modelPath = model.absolutePath,
                    backend = Backend.CPU(),
                    cacheDir = cacheDir.absolutePath
                )

                android.util.Log.d(
                    "READER_GEMMA",
                    "EngineConfig created"
                )

                showStatus("GEMMA: CREATING ENGINE")

                val e = Engine(config)

                android.util.Log.d(
                    "READER_GEMMA",
                    "Engine object created"
                )

                showStatus("GEMMA: LOADING MODEL")

                e.initialize()

                android.util.Log.d(
                    "READER_GEMMA",
                    "Engine initialized"
                )

                showStatus("GEMMA: CREATING CONVERSATION")

                val c = e.createConversation(
                    ConversationConfig(
                        systemInstruction = Contents.of(
                            "You are Gemma, a field mentor inside a speculative 2070 Reader. " +
                                    "Never give the answer directly. " +
                                    "Ask one short question that helps the user seek missing context. " +
                                    "Be concise, observational, and grounded."
                        )
                    )
                )

                android.util.Log.d(
                    "READER_GEMMA",
                    "Conversation created"
                )

                engine = e
                conversation = c

                showStatus("GEMMA: READY")

                withContext(Dispatchers.Main) {
                    web.evaluateJavascript(
                        "window.GemmaBridgeResponse && " +
                                "window.GemmaBridgeResponse('GEMMA READY')",
                        null
                    )
                }

            } catch (e: Exception) {

                android.util.Log.e(
                    "READER_GEMMA",
                    "Gemma initialization failed",
                    e
                )

                showStatus(
                    "GEMMA FAILED:\n${e.javaClass.simpleName}"
                )
            }
        }
    }


    private fun escapeJs(text: String): String {
        return text
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", " ")
            .replace("\r", " ")
    }

    inner class GemmaBridge {

        @JavascriptInterface
        fun generate(prompt: String) {

            showStatus("GEMMA RECEIVING REQUEST...")

            scope.launch(Dispatchers.IO) {

                val c = conversation

                if (c == null) {

                    showStatus("GEMMA NOT READY")

                    withContext(Dispatchers.Main) {
                        web.evaluateJavascript(
                            "window.GemmaBridgeResponse && " +
                                    "window.GemmaBridgeResponse(" +
                                    "'Gemma is not ready yet.'" +
                                    ")",
                            null
                        )
                    }

                    return@launch
                }

                val result = runCatching {

                    showStatus("GEMMA THINKING...")

                    val response = c.sendMessage(prompt)

                    response.contents.contents
                        .filterIsInstance<Content.Text>()
                        .joinToString("") { it.text }

                }.getOrElse {

                    "Gemma could not complete the reading: ${it.message}"
                }

                showStatus("GEMMA RESPONSE RECEIVED")

                val escaped = escapeJs(result)

                withContext(Dispatchers.Main) {

                    web.evaluateJavascript(
                        "window.GemmaBridgeResponse && " +
                                "window.GemmaBridgeResponse('$escaped')",
                        null
                    )
                }
            }
        }
    }

    override fun onDestroy() {

        conversation?.close()
        engine?.close()

        super.onDestroy()
    }
}