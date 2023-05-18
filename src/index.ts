const cheerio = require("cheerio");
const { Configuration, OpenAIApi } = require("openai");
import {menuItem} from "../src/Types/MenuItem"
require("dotenv").config();

const date = new Date();

/* OpenAI setup */
const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);

/* Scraper functions */
async function getHTML<T>(url: string): Promise<string> {
  const response = await fetch(url);
  return response.text();
}

async function getMenuFromHTML(html: string): Promise<menuItem[]> {
  let menu: any[] = [];
  let days: any[] = [];
  const $ = cheerio.load(html);

  $(".lunch-day-content", html).each(function (this: any) {
    const choices = $(this)
      .text()
      .replace(/(\r\n|\n|\r|\t)/gm, "")
      .split("99 kr");
    menu.push({
      choices,
    });
  });

  $(".lunch-day-header", html).each(function (this: any) {
    const date = $(this)
      .text()
      .replace(/(\r\n|\n|\r|\t)/gm, "")
      .split(" ");
    days.push({
      date,
    });
  });

  /* Return a nice and crisp menu */
  const formattedMenu = days.map((day, i) => {
    return { day: day.date[0], choices: menu[i].choices };
  });

  return formattedMenu;
}

(async () => {
  if(date.getDay() - 1<= 5){
    try {
      const html = await getHTML<string>(process.env.SKANSKA_URL!);
      const menu = await getMenuFromHTML(html);
  
      const response = await openai.createChatCompletion(
        {
          model: "gpt-3.5-turbo",
          temperature: 0.888,
          messages: [
            {
              role: "system",
              content: `Du är riktigt bra på att rekommendera luncher. Du väljer alltid endast en av rätterna från menyn att rekomendera användaren samt ger en motivering till varför. Vi gillar dyra ingredienser. Avsluta med en emoji och var flörtig.`,
            },
            {
              role: "user",
              content: `Vilken av dessa rätterna bör jag välja? ${
                menu[date.getDay() - 1].choices
              }`,
            },
          ],
        },
        { timeout: 60000 }
      );
  
      //Messages to return in endpoint when that will be set up later
      console.log(menu[date.getDay() - 1].day);
      console.log(menu[date.getDay() - 1].choices);
      console.log(response.data.choices[0].message);
    } catch (error) {
      console.log("OH NO:", error);
    }
  }else{
    console.log("Det är helg och Skanska har STÄNGT :(")
  }

})();

