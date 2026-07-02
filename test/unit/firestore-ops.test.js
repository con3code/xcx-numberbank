import {
    isRetryable,
    withRetry,
    toFiniteNumber,
    buildChangeTransaction,
    errorDisplayKey
} from '../../src/vm/extensions/block/firestore-ops.js';

const fbError = code => Object.assign(new Error(code), {code: code});

describe('toFiniteNumber', () => {
    test('数値はそのまま返す', () => {
        expect(toFiniteNumber(42)).toBe(42);
        expect(toFiniteNumber(-1.5)).toBe(-1.5);
        expect(toFiniteNumber(0)).toBe(0);
    });

    test('文字列の数値は変換する（既存データ互換）', () => {
        expect(toFiniteNumber('100')).toBe(100);
        expect(toFiniteNumber('-2.5')).toBe(-2.5);
    });

    test('変換不能な値はfallbackを返す', () => {
        expect(toFiniteNumber('abc')).toBe(0);
        expect(toFiniteNumber('abc', 9)).toBe(9);
        expect(toFiniteNumber('')).toBe(0);
        expect(toFiniteNumber(null)).toBe(0);
        expect(toFiniteNumber(undefined)).toBe(0);
        expect(toFiniteNumber(NaN)).toBe(0);
        expect(toFiniteNumber(Infinity)).toBe(0);
    });
});

describe('isRetryable', () => {
    test('一時障害コードはリトライ対象', () => {
        for (const code of ['unavailable', 'deadline-exceeded', 'aborted', 'resource-exhausted', 'internal']) {
            expect(isRetryable(fbError(code))).toBe(true);
        }
    });

    test('恒久エラーはリトライしない', () => {
        for (const code of ['permission-denied', 'unauthenticated', 'invalid-argument', 'not-found', 'failed-precondition']) {
            expect(isRetryable(fbError(code))).toBe(false);
        }
    });

    test('ネットワーク起因のTypeErrorはリトライ対象', () => {
        expect(isRetryable(new TypeError('Failed to fetch'))).toBe(true);
    });

    test('code無しの一般エラーはリトライしない', () => {
        expect(isRetryable(new Error('boom'))).toBe(false);
        expect(isRetryable(null)).toBe(false);
    });
});

describe('withRetry', () => {
    const noWait = () => Promise.resolve();

    test('成功時は1回だけ実行される', async () => {
        const fn = jest.fn().mockResolvedValue('ok');
        await expect(withRetry(fn, {sleeper: noWait})).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('unavailableは再試行して成功できる', async () => {
        const fn = jest.fn()
            .mockRejectedValueOnce(fbError('unavailable'))
            .mockRejectedValueOnce(fbError('unavailable'))
            .mockResolvedValue('ok');
        await expect(withRetry(fn, {retries: 3, sleeper: noWait})).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    test('リトライ回数を使い切ったら最後のエラーで失敗する', async () => {
        const fn = jest.fn().mockRejectedValue(fbError('unavailable'));
        await expect(withRetry(fn, {retries: 3, sleeper: noWait})).rejects.toMatchObject({code: 'unavailable'});
        expect(fn).toHaveBeenCalledTimes(4); // 初回 + 3リトライ
    });

    test('permission-deniedは即失敗（再試行しない）', async () => {
        const fn = jest.fn().mockRejectedValue(fbError('permission-denied'));
        await expect(withRetry(fn, {retries: 3, sleeper: noWait})).rejects.toMatchObject({code: 'permission-denied'});
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('バックオフ間隔が指数的に増える', async () => {
        const waits = [];
        const sleeper = ms => {
            waits.push(ms);
            return Promise.resolve();
        };
        const fn = jest.fn().mockRejectedValue(fbError('unavailable'));
        await expect(withRetry(fn, {retries: 3, baseMs: 500, sleeper})).rejects.toBeTruthy();
        expect(waits).toHaveLength(3);
        // ジッタは+25%まで
        expect(waits[0]).toBeGreaterThanOrEqual(500);
        expect(waits[0]).toBeLessThanOrEqual(625);
        expect(waits[1]).toBeGreaterThanOrEqual(1000);
        expect(waits[1]).toBeLessThanOrEqual(1250);
        expect(waits[2]).toBeGreaterThanOrEqual(2000);
        expect(waits[2]).toBeLessThanOrEqual(2500);
    });

    test('retries: 1 では合計2回で打ち切る', async () => {
        const fn = jest.fn().mockRejectedValue(fbError('unavailable'));
        await expect(withRetry(fn, {retries: 1, sleeper: noWait})).rejects.toBeTruthy();
        expect(fn).toHaveBeenCalledTimes(2);
    });
});

describe('buildChangeTransaction', () => {
    const keys = {
        bankSha256: 'BANKHASH',
        cardSha256: 'CARDHASH',
        masterSha256: 'MASTERHASH'
    };
    const cardDocRef = {id: 'card-ref'};
    const bankDocRef = {id: 'bank-ref'};

    const mockTx = snapshot => ({
        get: jest.fn().mockResolvedValue(snapshot),
        set: jest.fn()
    });

    test('既存docのnumberが文字列でも正しく加算する', async () => {
        const tx = mockTx({exists: () => true, data: () => ({number: '100'})});
        const run = buildChangeTransaction({
            cardDocRef, bankDocRef, delta: 5, keys, bankName: 'myBank', now: 1234
        });
        await expect(run(tx)).resolves.toBe(105);

        expect(tx.get).toHaveBeenCalledWith(cardDocRef);
        expect(tx.set).toHaveBeenCalledWith(cardDocRef, {
            number: 105,
            bank_key: 'BANKHASH',
            card_key: 'CARDHASH',
            master_key: 'MASTERHASH',
            time_stamp: 1234
        });
        expect(tx.set).toHaveBeenCalledWith(bankDocRef, {
            bank_name: 'myBank',
            time_stamp: 1234
        });
    });

    test('doc不存在なら0起点で加算する', async () => {
        const tx = mockTx({exists: () => false, data: () => undefined});
        const run = buildChangeTransaction({
            cardDocRef, bankDocRef, delta: '3', keys, bankName: 'myBank', now: 1
        });
        await expect(run(tx)).resolves.toBe(3);
        expect(tx.set).toHaveBeenCalledWith(cardDocRef, expect.objectContaining({number: 3}));
    });

    test('負のdeltaで減算できる', async () => {
        const tx = mockTx({exists: () => true, data: () => ({number: 10})});
        const run = buildChangeTransaction({
            cardDocRef, bankDocRef, delta: -4, keys, bankName: 'b', now: 1
        });
        await expect(run(tx)).resolves.toBe(6);
    });

    test('numberが壊れた値でも0起点として扱う', async () => {
        const tx = mockTx({exists: () => true, data: () => ({number: 'not-a-number'})});
        const run = buildChangeTransaction({
            cardDocRef, bankDocRef, delta: 7, keys, bankName: 'b', now: 1
        });
        await expect(run(tx)).resolves.toBe(7);
    });
});

describe('errorDisplayKey', () => {
    test('接続系はoffline', () => {
        expect(errorDisplayKey('unavailable')).toBe('offline');
        expect(errorDisplayKey('deadline-exceeded')).toBe('offline');
    });
    test('権限系はnotAllowed', () => {
        expect(errorDisplayKey('permission-denied')).toBe('notAllowed');
        expect(errorDisplayKey('unauthenticated')).toBe('notAllowed');
    });
    test('その他はerror', () => {
        expect(errorDisplayKey('internal')).toBe('error');
        expect(errorDisplayKey(undefined)).toBe('error');
    });
});
