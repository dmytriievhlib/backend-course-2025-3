// main.js
import { Command } from "commander";
import fs from "fs";

const program = new Command();
// --- Перехоплення помилок для виводу кастомного тексту ---
program.configureOutput({
  outputError: (str, write) => {
    if (str.includes("option '-i, --input")) {
      write("Please, specify input file\n");
    } else {
      write(str);
    }
  }
});
program
  .requiredOption("-i, --input <path>", "шлях до вхідного JSON файлу")
  .option("-o, --output <path>", "шлях до вихідного файлу")
  .option("-d, --display", "вивести результат у консоль")
  .option("--date", "додати дату перед часом у повітрі та відстанню")
  .option(
    "-a, --airtime <minutes>",
    "фільтр: показати рейси з часом у повітрі більше ніж заданий",
    parseInt
  );

program.parse(process.argv);
const options = program.opts();

// === Перевірки ===
if (!options.input) {
  console.error("Please, specify input file");
  process.exit(1);
}
if (!fs.existsSync(options.input)) {
  console.error("Cannot find input file");
  process.exit(1);
}

// === Читання пострічково ===
const rawData = fs.readFileSync(options.input, "utf-8");
const lines = rawData.split("\n").filter(l => l.trim() !== "");

let results = [];

for (const line of lines) {
  try {
    const flight = JSON.parse(line);

    // фільтр за airtime
    if (options.airtime && (!flight.AIR_TIME || flight.AIR_TIME <= options.airtime)) {
      continue;
    }

    // формування рядка
    let row = "";
    if (options.date && flight.FL_DATE) row += flight.FL_DATE + " ";
    row += (flight.AIR_TIME ?? "") + " " + (flight.DISTANCE ?? "");
    results.push(row.trim());
  } catch {
    continue; // пропускаємо биті рядки
  }
}

// === Вивід ===
if (options.output) {
  fs.writeFileSync(options.output, results.join("\n"), "utf-8");
}
if (options.display) {
  console.log(results.join("\n"));
}
