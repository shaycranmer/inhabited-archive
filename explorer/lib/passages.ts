export type CandidateLabel =
  | "strong_match"
  | "contextual_match"
  | "incidental_quantity";

export type Passage = {
  id: string;
  author: string;
  work: string;
  locus: string;
  dateLabel: string;
  tradition: string;
  language: "grc" | "lat";
  languageLabel: string;
  original: string;
  translation: string;
  translationCredit: string;
  sourceUrl: string;
  sourceLabel: string;
  rights: string;
  expectedLabel: CandidateLabel;
};

export const passages: Passage[] = [
  {
    id: "nicomachus-arith-1-16",
    author: "Nicomachus of Gerasa",
    work: "Introduction to Arithmetic",
    locus: "1.16",
    dateLabel: "c. 100 CE",
    tradition: "Greek arithmetic",
    language: "grc",
    languageLabel: "Ancient Greek",
    original:
      "Ἀντικειμένων δὲ τῶν δύο τούτων εἰδῶν ὡς ἀκροτήτων τρόπῳ μεσότης φαίνεται ὁ λεγόμενος τέλειος ἐν ἰσότητι εὑρισκόμενος … ὁ τοῖς ἑαυτοῦ μέρεσιν ἶσος ὤν· οἷον ὁ Ϛ καὶ ὁ κη.",
    translation:
      "Between these two opposed kinds, as though between extremes, appears the mean called perfect, found in equality … a number equal to its own parts, such as 6 and 28.",
    translationCredit: "Working translation by the Number Rants project",
    sourceUrl:
      "https://github.com/OpenGreekAndLatin/First1KGreek/blob/master/data/tlg0358/tlg001/tlg0358.tlg001.1st1K-grc1.xml",
    sourceLabel: "Open Greek and Latin, Hoche edition (1866)",
    rights: "Source XML: CC BY-SA 4.0; project translation: CC BY-SA 4.0",
    expectedLabel: "strong_match",
  },
  {
    id: "augustine-civitate-11-30",
    author: "Augustine of Hippo",
    work: "The City of God",
    locus: "11.30",
    dateLabel: "413–426 CE",
    tradition: "Latin Christianity",
    language: "lat",
    languageLabel: "Latin",
    original:
      "Haec autem propter senarii numeri perfectionem eodem die sexiens repetito sex diebus perfecta narrantur … quia per senarium numerum est operum significata perfectio.",
    translation:
      "The works are said to have been completed in six days because six is a perfect number—not because God needed time, but because six signified the perfection of the works.",
    translationCredit:
      "Condensed project translation; compare Marcus Dods (1887), public domain",
    sourceUrl: "https://www.augustinus.it/latino/cdd/cdd_11_libro.htm",
    sourceLabel: "Augustinus.it, De civitate Dei 11.30",
    rights: "Ancient Latin text: public domain; project translation: CC BY 4.0",
    expectedLabel: "strong_match",
  },
  {
    id: "synthetic-six-donkeys",
    author: "Evaluation fixture",
    work: "Six Donkeys",
    locus: "sentence 1",
    dateLabel: "Project-authored",
    tradition: "Negative control",
    language: "lat",
    languageLabel: "Latin",
    original: "Marcus sex asinos in agro habet.",
    translation: "Marcus has six donkeys in the field.",
    translationCredit: "Number Rants project",
    sourceUrl:
      "https://github.com/shaycranmer/inhabited-archive",
    sourceLabel: "Synthetic evaluation sentence",
    rights: "CC0 1.0",
    expectedLabel: "incidental_quantity",
  },
];
