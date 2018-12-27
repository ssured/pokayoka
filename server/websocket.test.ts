import puppeteer, { Browser } from 'puppeteer';
import { objectFromPatchStream } from '../src/utils';

const options = {
  // headless: false
};

// this function removes Wallaby injected trace calls from the passed function
const noTrace = <T extends (...args: any[]) => any>(fn: T): T => {
  const lines = fn.toString().split('\n');
  lines.splice(1, 0, 'function noop(){};');
  const cleanSource = lines
    .join('\n')
    .replace(/\$_\$(\w)*/g, 'noop')
    .replace(/noop\.log/g, 'console.log');
  // console.log(cleanSource);
  // tslint:disable-next-line no-eval
  return eval(cleanSource) as T;
};

const evaluate = <T extends (...args: any[]) => any>(
  page: puppeteer.Page,
  fn: T
): any => page.evaluate(noTrace(fn));

describe('websocket data layer communication', () => {
  let browser: Browser;
  beforeAll(async () => {
    // browser = await puppeteer.launch({
    //   headless: (options as any).headless,
    // });
  });
  afterAll(async () => {
    // await browser.close();
  });

  test.skip('CouchDB runs on localhost', async () => {
    const page = await browser.newPage();
    await page.goto('http://localhost:5984');
    const result = await evaluate(page, () => {
      return document.body.innerText;
    });
    expect(result.indexOf('"couchdb":"Welcome"')).toBeGreaterThan(-1);
  });

  it.skip('Connects to the debug websocket', async () => {
    const page = await browser.newPage();
    await page.goto('http://localhost:5984');

    const {
      object: state,
      updateObject: updateState,
    } = objectFromPatchStream();
    page.on('console', async message => {
      const [typePromise, valuePromise] = message.args();
      if ((typePromise && (await typePromise.jsonValue())) === 'debug') {
        try {
          updateState(JSON.parse(await valuePromise.jsonValue()));
        } catch (e) {}
      }
    });
    await evaluate(page, () => {
      const ws = new WebSocket('ws://localhost:3000/debug', 'v1');
      ws.addEventListener('message', ({ data }) => console.log('debug', data));
    });

    await evaluate(page, () => {
      const ws = ((window as any).wsAbcd = new WebSocket(
        'ws://localhost:3000/abcd',
        'v1'
      ));
      ws.addEventListener('message', ({ data }) => console.log(data));
    });

    await new Promise(res => setTimeout(res, 100));

    const socketCount: number = state() && state().projects.abcd.socketCount;

    expect(
      await evaluate(page, () => {
        try {
          (window as any).wsAbcd.close();
          return true;
        } catch (e) {
          return e;
        }
      })
    ).toBe(true);

    await new Promise(res => setTimeout(res, 100));

    expect(state() && state().projects.abcd.socketCount).toBe(socketCount - 1);
  });
});
