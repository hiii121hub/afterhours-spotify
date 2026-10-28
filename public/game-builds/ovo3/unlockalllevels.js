// Reviewed game helpers: time, input, localization, replay and real SDK adapters.
if (!window.globalThis) {
    window.globalThis = window;
}


// get query param verbose
function getQueryParam(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(location.search);
    return results === null ?
        "" :
        decodeURIComponent(results[1].replace(/\+/g, " "));
}



function formatMs(s) {
    console.log("formatMs", s);
    let ms = s * 1000;
    // format ms to mm:ss:ms
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);

    seconds = seconds % 60;
    let milliseconds = ms % 1000;
    // only keep 2 digits
    milliseconds = Math.floor(milliseconds / 10);

    return (
        (minutes < 10 ? "0" + minutes : minutes) +
        ":" +
        (seconds < 10 ? "0" + seconds : seconds) +
        ":" +
        (milliseconds < 10 ? "0" + milliseconds : milliseconds)
    );
}





// Legacy game event adapters. Actual SDK outcomes are preserved.
function crazyHappyTime() { return globalThis.WebSdkWrapper.happyTime(); }
function crazyGameplayStart() { return globalThis.WebSdkWrapper.gameplayStart(); }
function crazyGameplayStop() { return globalThis.WebSdkWrapper.gameplayStop(); }
function crazyMidRoll() {
    return globalThis.WebSdkWrapper.interstitial().then(success => {
        c2_callFunction(success ? "adOver" : "adOverFail");
    });
}
function crazyRewarded() {
    return globalThis.WebSdkWrapper.rewarded().then(success => {
        c2_callFunction(success === true ? "adOver" : "adOverFail");
    });
}

// =================== DEBUG =====================
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv

function execCode(code) {
    c2_callFunction("execCode", [code]);
}

function dumpSave() {
    c2_callFunction("dumpSave");
}

(function() {
    function handleAnyTouchEvent() {
        c2_callFunction("Save > Auto Update Mobile Mode");
    }
    var el = document.getElementsByTagName("canvas")[0];
    el.addEventListener("touchstart", handleAnyTouchEvent, false);
    el.addEventListener("touchend", handleAnyTouchEvent, false);
    el.addEventListener("touchcancel", handleAnyTouchEvent, false);
    el.addEventListener("touchleave", handleAnyTouchEvent, false);
    el.addEventListener("touchmove", handleAnyTouchEvent, false);
})();

function isIpad() {
    const ua = window.navigator.userAgent;
    if (ua.indexOf("iPad") > -1) {
        return true;
    }

    if (ua.indexOf("Macintosh") > -1) {
        try {
            document.createEvent("TouchEvent");
            return true;
        } catch (e) {}
    }

    return false;
}

// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// =================== DEBUG =====================

// ================= LANGUAGES ===================
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv

function tsvToArray(tsv) {
    let tempArr = tsv.split(/\r?\n|\r/);
    return tempArr.map((x) => x.split("\t"));
}

function mergeInstanceVars() {
    let saved = JSON.parse(globalThis.savedVars);
    let real = JSON.parse(globalThis.curVars);
    return JSON.stringify(
        real.map((val, i) => (i < saved.length ? saved[i] : val))
    );
}

function detectLanguage() {
    let langs = Object.keys(globalThis.languageJSON.languages);
    var userLangs = navigator.language || navigator.userLanguage;
    userLangs = navigator.languages || [userLangs];
    let compareLangs = (lang, curLang) => {
        if (curLang.toLowerCase() === lang.slice(0, curLang.length).toLowerCase()) {
            return true;
        }
        let subLang = curLang.split("-")[0];
        return (
            subLang.toLowerCase() === lang.slice(0, subLang.length).toLowerCase()
        );
    };
    for (let i = 0; i < userLangs.length; i++) {
        let curLang = userLangs[i];
        let res = langs.find(compareLangs.bind(null, curLang));
        if (res) return res;
    }
    return "en-us";
}

function translateTips(locale) {
    if (!localeExists(locale)) locale = detectLanguage();
    let tips = globalThis.gatheredTips;
    let json = JSON.parse(tips);
    let res = json.map((tip, index) => {
        key = `tip${index + 1}`;
        return {
            text: getLanguageValue(locale, key, "text", tip.text, ""),
            frame: tip.frame,
        };
    });
    if (globalThis.adconfigRemoveSocials) {
        globalThis.tmptmp = res;
        res = res.filter((x) => !x.text.includes("discord"));
    }
    return JSON.stringify(res);
}

async function getTranslations() {
    let result = await fetch(
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOU_pMce0njTy64pTFVI7yLN2t5ReGYaRCmJDdj_KRSSbAEL7XPixR80X4Jzm0r8sDL0KHq1QRkVGC/pub?output=tsv"
    );
    let data = await result.text();
    let array = tsvToArray(data);
    const json = {};
    json.version = array[0][0];
    const length = array[1].length;
    json.languages = {};

    const startX = 4;
    const startY = 3;
    const colsPerLang = 2;
    const idColumn = 2;
    const langRow = 1;
    const langIdRow = 2;
    const rowsPerLine = 1;
    for (let i = startX; i < length; i += colsPerLang) {
        json.languages[array[langIdRow][i]] = array[langRow][i];
    }
    json.data = {};
    for (let i = startY; i < array.length; i += rowsPerLine) {
        for (let j = startX; j < length; j += colsPerLang) {
            json.data[array[langIdRow][j]] = json.data[array[langIdRow][j]] || {};
            if (json.data[array[langIdRow][j]][array[i][idColumn]]) {
                console.warn("key " + array[i][idColumn] + "already exists");
            }
            json.data[array[langIdRow][j]][array[i][idColumn]] = {
                text: array[i][j],
                extra: [],
            };
            for (let k = 1; k < colsPerLang; k++) {
                try {
                    let extrajson = JSON.parse(array[i][j + k]);
                    Object.keys(extrajson).forEach((key) => {
                        if (key === "text" || key === "extra") return;
                        json.data[array[langIdRow][j]][array[i][idColumn]][key] =
                            extrajson[key];
                    });
                } catch (e) {
                    json.data[array[langIdRow][j]][array[i][idColumn]].extra.push(
                        array[i][j + k]
                    );
                }
            }
        }
    }
    c2_callFunction("Language > LoadLanguageFile", [JSON.stringify(json)]);
    globalThis.languageJSON = json;
    return json;
}

function listLanguages() {
    return JSON.stringify(
        Object.keys(globalThis.languageJSON.languages).map((lang) => ({
            anim: lang.replace("-", ""),
            name: globalThis.languageJSON.languages[lang],
        }))
    );
}

function getLocale(index) {
    return Object.keys(globalThis.languageJSON.languages)[index];
}

function levenshteinDistance(str1 = "", str2 = "") {
    const track = Array(str2.length + 1)
        .fill(null)
        .map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1, // deletion
                track[j - 1][i] + 1, // insertion
                track[j - 1][i - 1] + indicator // substitution
            );
        }
    }
    return track[str2.length][str1.length];
}

function getLocaleName(locale) {
    if (!localeExists(locale)) locale = detectLanguage();
    if (
        globalThis.languageJSON &&
        globalThis.languageJSON.languages.hasOwnProperty(locale)
    )
        return globalThis.languageJSON.languages[locale];
    return "Unknown";
}

function setLanguageJSON() {
    globalThis.languageJSON = JSON.parse(globalThis.tempLanguageJSON);
}

function languageKeyExists(locale, key) {
    if (key.trim() === "") return 0;
    if (!localeExists(locale)) locale = detectLanguage();
    return globalThis.languageJSON.data[locale].hasOwnProperty(key) ? 1 : 0;
}

let cache = {};

function findLanguageKey(locale, text) {
    if (!localeExists(locale)) locale = detectLanguage();
    if (cache[locale] && cache[locale][text]) return cache[locale][text];
    let localeData = globalThis.languageJSON.data[locale];
    let key = Object.keys(localeData).find(
        (key) =>
        levenshteinDistance(
            localeData[key].text.toLowerCase(),
            text.toLowerCase()
        ) <= Math.min(3, Math.floor(text.length / 5))
    );
    console.log(key);
    if (key) {
        cache[locale] = cache[locale] || {};
        cache[locale][text] = key;
        return key;
    }
    cache[locale] = cache[locale] || {};
    cache[locale][text] = "";
    return "";
}

function processString(string, ...params) {
    params.forEach((param, i) => {
        string = string.replace(`{${i}}`, param.toString());
    });
    return string;
}

function localeExists(locale) {
    return (
        globalThis.languageJSON &&
        globalThis.languageJSON.languages.hasOwnProperty(locale)
    );
}

var __ovoIsSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

function doGetLanguageValue(locale, key, value, defaultValue, metadata) {
    if (!globalThis.languageJSON || !globalThis.languageJSON.languages)
        return defaultValue;
    if (!localeExists(locale)) locale = detectLanguage();
    if (key !== "" && languageKeyExists(locale, key) === 1) {
        let data = globalThis.languageJSON.data[locale][key];
        if (data.hasOwnProperty(value)) return data[value];
    }
    if (metadata !== "") {
        try {
            let obj = JSON.parse(metadata);
            if (obj.hasOwnProperty(value)) return obj[value];
            return defaultValue;
        } catch (e) {}
    }
    return defaultValue;
}

function getLanguageValue(locale, key, value, defaultValue, metadata) {
    let ret = doGetLanguageValue(locale, key, value, defaultValue, metadata);
    if (
        __ovoIsSafari &&
        value.trim().toLowerCase() === "aligny" &&
        ret < 90 &&
        ret > 10
    )
        return 50;
    if (globalThis.adconfigNoReligion === 1) {
        if (
            locale === "en-us" &&
            value.trim().toLowerCase() === "text" &&
            ret === "Hellish"
        )
            return "Dangerous";
        if (
            locale === "en-us" &&
            value.trim().toLowerCase() === "text" &&
            ret === "Hellish"
        )
            return "Dangerous";
        if (
            locale === "en-us" &&
            value.trim().toLowerCase() === "text" &&
            ret === "Coin God"
        )
            return "Coin Master";
    }
    return ret;
}

// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// ================= LANGUAGES ===================

// =============== LZMA COMPRESS =================
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv

function compressReplay(replay) {
    LZMA_WORKER.compress(replay, "1", function(result, error) {
        if (error) console.error(error);
        else c2_callFunction("replayCompressed", [convert_to_formated_hex(result)]);
    });
}

function decompressReplay(replay) {
    var byte_arr = convert_formated_hex_to_bytes(replay);
    if (byte_arr == false) {
        alert("invalid replay file");
        return false;
    }
    LZMA_WORKER.decompress(byte_arr, function(result, error) {
        if (error) console.error(error);
        else c2_callFunction("replayDecompressed", [result]);
    });
}

function convert_formated_hex_to_bytes(hex_str) {
    var count = 0,
        hex_arr,
        hex_data = [],
        hex_len,
        i;

    if (hex_str.trim() == "") return [];

    /// Check for invalid hex characters.
    if (/[^0-9a-fA-F\s]/.test(hex_str)) {
        return false;
    }

    hex_arr = hex_str.split(/([0-9a-fA-F]+)/g);
    hex_len = hex_arr.length;

    for (i = 0; i < hex_len; ++i) {
        if (hex_arr[i].trim() == "") {
            continue;
        }
        hex_data[count++] = parseInt(hex_arr[i], 16);
    }

    return hex_data;
}

function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}

function convert_formated_hex_to_string(s) {
    var byte_arr = convert_formated_hex_to_bytes(s);
    var res = "";
    for (var i = 0; i < byte_arr.length; i += 2) {
        res += String.fromCharCode(byte_arr[i] | (byte_arr[i + 1] << 8));
    }
    return res;
}

function convert_string_to_hex(s) {
    var byte_arr = [];
    for (var i = 0; i < s.length; i++) {
        var value = s.charCodeAt(i);
        byte_arr.push(value & 255);
        byte_arr.push((value >> 8) & 255);
    }
    return convert_to_formated_hex(byte_arr);
}

function is_array(input) {
    return typeof input === "object" && input instanceof Array;
}

function convert_to_formated_hex(byte_arr) {
    var hex_str = "",
        i,
        len,
        tmp_hex;

    if (!is_array(byte_arr)) {
        return false;
    }

    len = byte_arr.length;

    for (i = 0; i < len; ++i) {
        if (byte_arr[i] < 0) {
            byte_arr[i] = byte_arr[i] + 256;
        }
        if (byte_arr[i] === undefined) {
            alert("Boom " + i);
            byte_arr[i] = 0;
        }
        tmp_hex = byte_arr[i].toString(16);

        // Add leading zero.
        if (tmp_hex.length == 1) tmp_hex = "0" + tmp_hex;

        if ((i + 1) % 16 === 0) {
            tmp_hex += "\n";
        } else {
            tmp_hex += " ";
        }

        hex_str += tmp_hex;
    }

    return hex_str.trim();
}

// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// =============== LZMA COMPRESS =================