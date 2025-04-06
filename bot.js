const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const conf = JSON.parse(fs.readFileSync('conf.json'));
const token = conf.key;
const url = conf.url;
const api = conf.api;
const api2 = conf.api2;
let latituidine;
let longitudine;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function cordinate(città,api2) {
    try{
        await sleep(5000);
        const url = `https://us1.locationiq.com/v1/search.php?key=${api2}&q=${città}&format=json`;
        const res = await fetch(url);
        const data = await res.json();
        return [data[0].lat ,data[0].lon];
    }
    catch (error) {
        console.error("Errore durante la geocodifica:", error.message);
        return [45.2740 ,9.0934];
    }
}

async function meteo(packageType, g, lat, lon) {
    const url = `https://my.meteoblue.com/packages/${packageType}?lat=${lat}&lon=${lon}&apikey=${api}&forecast_days=${g}&tz=Europe/Rome`;
    const res = await fetch(url);
    return await res.json();
}

function output(data) {
    let risultato = "";
    for (let i = 0; i < data.time.length; i++) {
        const orario = new Date(data.time[i]).getHours();
        const temperatura = data.temperature[i];
        risultato += `${orario}:00 - ${temperatura}°C\n`;
    }
    return risultato;
}
function outputdomani(data) {
    const adesso = new Date();
    let risultato = "";
    for (let i = 0; i < data.time.length; i++) {
        const orario = new Date(data.time[i]);
        if (orario.getDate() === adesso.getDate() + 1) {
            output += `${orario.getHours()}:00 - ${data.temperature[i]}°C\n`;
        }
    }
    return output;
}

function output3(data) {
    let risultato = "";
    for (let i = 0; i < data.time.length; i++) {
        const tempo = data.time[i];
        const temperatura = data.temperature[i];
        risultato += `${tempo} - ${temperatura}°C\n`;
    }
    return risultato;
}
function output7(data) {
    let risultato = "";
    for (let i = 0; i < data.time.length; i++) {
        const tempo = data.time[i];
        const tempMin = data.temperature_min[i];
        const tempMax = data.temperature_max[i];
        risultato += `${tempo}: ${tempMin}°C - ${tempMax}°C\n`;
    }
    return risultato;
}

const bot =new TelegramBot(token, {polling: true});

bot.on("message", async (msg) =>{
    const chatId =msg.chat.id;

    let text = msg.text;
    let text2;
    let città;
    [text2,città]= text.split(",");
    città=String(città);
    città = città.replace(",", "");
    let cord= await cordinate(città,api2);
    lat=cord[0];
    lon=cord[1];

    if(text=== "/start"){
        bot.sendMessage(chatId,"Bot in funzione!");
    }
    else if(text=== "/help"){
        bot.sendMessage(chatId,"Ecco un esempio della lista dei comandi disponibili:");
        bot.sendMessage(chatId,"/today,Milano: previsioni di oggi per la città di Milano");
        bot.sendMessage(chatId,"/tomorrow,Roma: previsioni di domani per la città di Roma");
        bot.sendMessage(chatId,"/3days,Torino: previsioni dei prossimi 3 giorni per la città di Torino");
        bot.sendMessage(chatId,"/7days,Palermo: previsioni dei prossimi 7 giorni per la città di Plermo");

    }
    else{
        if (text2 === "/today") {
            console.log("prova");
            const weather = await meteo("basic-1h", 1, lat, lon);
            const message = output(weather.data_1h, 0);
            bot.sendMessage(chatId, `Meteo di oggi a ${città}:\n${message}`);
        }
    
        else if (text2 === "/tomorrow") {
            const weather = await meteo("basic-1h", 2, lat, lon);
            const message = outputdomani(weather.data_1h, 1);
            bot.sendMessage(chatId, `Meteo di domani a ${città}:\n${message}`);
        }
    
        else if (text2 === "/3days") {
            const weather = await meteo("basic-3h", 3, lat, lon);
            const message = output3(weather.data_3h);
            bot.sendMessage(chatId, `Meteo prossimi 3 giorni a ${città}:\n${message}`);
        }
    
        else if (text2 === "/7days") {
            const weather = await meteo("basic-day", 7, lat, lon);
            const message = output7(weather.data_day);
            bot.sendMessage(chatId, `Meteo prossimi 7 giorni a ${città}:\n${message}`);
        }
        else{
            console.log("errore");
        }   
    }
})