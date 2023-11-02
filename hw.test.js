const { chooseDay, chooseSeat } = require("./lib/utils.js");
const { clickElement, getText } = require("./lib/commands.js");

let page;
const now = new Date();

beforeEach(async () => {
  page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
});

afterEach(async () => {
  page.close();
});

describe("Booking seats in Cinema", () => {
  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto("http://qamid.tmweb.ru/client/index.php");
    const today = now.getDate();
    const tomorrow = today + 1;
    await chooseDay(page, `.page-nav__day-number`, tomorrow);
  });

  async function bookSeat(seatType) {
    await clickElement(page, `.movie-seances__time[data-seance-id='177']`);
    const seats = await page.$$(`.buying-scheme__chair_${seatType}`);
    await chooseSeat(seats);
    await clickElement(page, `.acceptin-button`);
    const actual = await getText(page, `h2.ticket__check-title`);
    expect(actual).toContain("Вы выбрали билеты:");
  }

  // First and second path tests
  test("Booking 1 standard seat", async () => {
    await bookSeat("standart");
  });

  test("Booking 1 VIP seat", async () => {
    await bookSeat("vip");
  });

  // Third test - bad path
  test("Don't book a seat", async () => {
    function isSeatBookingEnabled() {
      return now.getHours() > 10;
    }

    if (isSeatBookingEnabled()) {
      const today = now.getDate();
      await chooseDay(page, `.page-nav__day-number`, today);
      const element = await page.$(`[data-seance-id="177"]`);
      const classList = await page.evaluate(
        (element) => Array.from(element.classList),
        element
      );
      const hasClass =
        classList.includes("movie-seances__time") &&
        classList.includes("acceptin-button-disabled");
      expect(hasClass).toBe(true);
    } else {
      await clickElement(page, `[data-seance-id='177']`);
      const isDisabled = await page.$eval("button", (button) => button.disabled);
      expect(isDisabled).toBe(true);
    }
  });
});
