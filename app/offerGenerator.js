const { GoogleGenerativeAI } = require("@google/generative-ai");

let previousNonce = 0;
let validNonce = null;


function generateNonce() {
    previousNonce = previousNonce + 1;
    return previousNonce;
}


function generateOffer(window, apiKey, specifications) {
    nonce = generateNonce();
    validNonce = nonce;
    const googleGenAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = googleGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = (
        "Based on the following specifications, write a good sale offer for this device, that could go into a marketplace website.\n" +
        "Make sure to include important information like CPU, disk, RAM, GPU. Make sure not to make any mistakes.\n" +
        "Don't just list the specifications, include descriptions.\n" +
        "Take in mind that not all specifications shown must be included, you can leave out minor details.\n" +
        "Don't add any markdown formatting. Divide the offer into at least 5 paragraphs.\n" +
        "Impress me with the result.\n" +
        "\n" +
        "Specifications:\n" +
        specifications
    ).trim();

    geminiModel.generateContent(prompt).then(result => {
        if (nonce === validNonce) {
            let offer =  result.response.text().trim();
            verifyOffer(window, apiKey, specifications, offer, nonce);
        }
    }).catch(error => {
        console.error(error);
        if (nonce === validNonce) {
            if (error.errorDetails && error.errorDetails[0] && error.errorDetails[0].reason && error.errorDetails[0].reason === 'API_KEY_INVALID') {
                window.webContents.send('show-generation-error', "Invalid API key");
            } else if (error.message && error.message.includes('fetch failed')) {
                setTimeout(() => {
                    window.webContents.send('show-generation-error', "Could not connect to AI service");
                }, 250);
            } else if (error.status && error.status === 503) {
                window.webContents.send('show-generation-error', "AI service temporarily unavailable");
            } else {
                window.webContents.send('show-generation-error', "Error generating offer");
            }
            validNonce = null;
        }
    });
}


function verifyOffer(window, apiKey, specifications, offer, nonce) {
    const googleGenAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = googleGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = (
        "Based on the provided specifications fix any major mistakes in the provided device sale offer.\n" +
        "If the specifications look wrong, or offer does not match the specifications at all, respond only with 'error' and nothing more.\n" +
        "Fix any wrong specification details. Fix layout by adding line breaks if the offer has less than 5 paragraphs or if any lines are too long.\n" +
        "Don't fix minor problems like grammar.\n" +
        "Remove any markdown formatting. Respond with the improved offer only (or 'error').\n" +
        "\n" +
        "Specifications:\n" +
        specifications + "\n" +
        "\n" +
        "Offer:\n" +
        offer
    ).trim();

    geminiModel.generateContent(prompt).then(result => {
        if (nonce === validNonce) {
            let verifiedOffer = result.response.text().trim()
            if (['error', '"error"', "'error'"].includes(verifiedOffer.toLowerCase())) {
                window.webContents.send('show-generation-error', "Specifications are likely invalid");
            } else {
                window.webContents.send('finish-generating', verifiedOffer);
            }
            validNonce = null;
        }
    }).catch(error => {
        console.error(error);
        if (nonce === validNonce) {
            if (error.errorDetails && error.errorDetails[0] && error.errorDetails[0].reason && error.errorDetails[0].reason === 'API_KEY_INVALID') {
                window.webContents.send('show-generation-error', "Invalid API key");
            } else if (error.message && error.message.includes('fetch failed')) {
                window.webContents.send('show-generation-error', "Could not connect to AI service");
            } else if (error.status && error.status === 503) {
                window.webContents.send('show-generation-error', "AI service temporarily unavailable");
            } else {
                window.webContents.send('show-generation-error', "Error generating offer");
            }
            validNonce = null;
        }
    });
}


function cancelGenerating() {
    validNonce = null;
}


module.exports = {
    generateOffer,
    cancelGenerating
};
