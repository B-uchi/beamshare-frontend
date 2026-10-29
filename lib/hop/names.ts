const ADJECTIVES = [
  "Amber", "Brisk", "Cobalt", "Dapper", "Eager", "Fleet", "Gentle", "Hazel", "Indigo", "Jolly",
  "Keen", "Lucky", "Mellow", "Nimble", "Olive", "Plucky", "Quiet", "Rapid", "Sunny", "Tidy",
  "Upbeat", "Vivid", "Witty", "Zesty",
];

const ANIMALS = [
  "Badger", "Crane", "Dingo", "Egret", "Ferret", "Gecko", "Heron", "Ibex", "Jackal", "Koala",
  "Lemur", "Marten", "Newt", "Otter", "Puffin", "Quail", "Raven", "Stoat", "Tapir", "Urchin",
  "Vole", "Walrus", "Yak", "Zebu",
];

export function randomName() {
  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  return `${pick(ADJECTIVES)} ${pick(ANIMALS)}`;
}
