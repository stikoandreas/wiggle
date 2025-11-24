import { getImageNumber } from './Renderer';

describe('getImageNumber', () => {
  it('cycles through images alternatingly', () => {
    expect(getImageNumber(5, 0)).toBe(0);
    expect(getImageNumber(5, 1)).toBe(1);
    expect(getImageNumber(5, 2)).toBe(2);
    expect(getImageNumber(5, 3)).toBe(3);
    expect(getImageNumber(5, 4)).toBe(4);
    expect(getImageNumber(5, 5)).toBe(3);
    expect(getImageNumber(5, 6)).toBe(2);
    expect(getImageNumber(5, 7)).toBe(1);
    expect(getImageNumber(5, 8)).toBe(0);
    expect(getImageNumber(5, 9)).toBe(1);

    expect(getImageNumber(3, 0)).toBe(0);
    expect(getImageNumber(3, 1)).toBe(1);
    expect(getImageNumber(3, 2)).toBe(2);
    expect(getImageNumber(3, 3)).toBe(1);
    expect(getImageNumber(3, 4)).toBe(0);
    expect(getImageNumber(3, 5)).toBe(1);

    expect(getImageNumber(4, 0)).toBe(0);
    expect(getImageNumber(4, 1)).toBe(1);
    expect(getImageNumber(4, 2)).toBe(2);
    expect(getImageNumber(4, 3)).toBe(3);
    expect(getImageNumber(4, 4)).toBe(2);
    expect(getImageNumber(4, 5)).toBe(1);
    expect(getImageNumber(4, 6)).toBe(0);
  });
});
