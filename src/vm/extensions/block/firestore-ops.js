/**
 * Firestore操作の純粋ヘルパー群。
 * db等のモジュール状態を持たず、index.jsから独立してテストできる。
 */

// 一時障害としてリトライしてよいFirestoreエラーコード。
// permission-denied / unauthenticated / invalid-argument / not-found /
// failed-precondition は再試行しても結果が変わらないため対象外。
export const RETRYABLE_CODES = [
    'unavailable',
    'deadline-exceeded',
    'aborted',
    'resource-exhausted',
    'internal'
];

export function isRetryable (error) {
    if (!error) return false;
    if (error.code && RETRYABLE_CODES.includes(error.code)) return true;
    // fetch系のネットワーク失敗はTypeErrorで届く
    if (error instanceof TypeError) return true;
    return false;
}

/**
 * 指数バックオフ+ジッタつきリトライ。
 * @param {Function} fn - Promiseを返す関数
 * @param {object} options
 * @param {number} options.retries - 再試行回数（初回実行は含まない）
 * @param {number} options.baseMs - 初回待機時間（以後2倍ずつ）
 * @param {Function} options.sleeper - テスト差し替え用のsleep関数
 * @returns {Promise} fnの結果
 */
export function withRetry (fn, {retries = 3, baseMs = 500, sleeper} = {}) {
    const sleep = sleeper || (ms => new Promise(resolve => setTimeout(resolve, ms)));
    const attempt = remaining => fn().catch(error => {
        if (remaining <= 0 || !isRetryable(error)) throw error;
        const waitMs = baseMs * Math.pow(2, retries - remaining) * (1 + (Math.random() * 0.25));
        return sleep(waitMs).then(() => attempt(remaining - 1));
    });
    return attempt(retries);
}

/**
 * 既存データのnumberは文字列で保存されていることがあるため、
 * 有限数値に正規化する。変換できなければfallback。
 */
export function toFiniteNumber (v, fallback = 0) {
    if (v === '' || v === null || typeof v === 'undefined') return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

/**
 * 「[CARD] of [BANK] を [VAL] ずつ変える」のトランザクション本体を組み立てる。
 * runTransaction(db, buildChangeTransaction({...})) の形で使う。
 * card/bank両ドキュメントを同一トランザクションで書くため原子的。
 * フィールド構成は putNum と完全に同一（スキーマ互換）。
 * @returns {Function} tx => Promise<number> 加算後の値を返す
 */
export function buildChangeTransaction ({cardDocRef, bankDocRef, delta, keys, bankName, now}) {
    return tx => tx.get(cardDocRef).then(snap => {
        const base = snap.exists() ? toFiniteNumber(snap.data().number, 0) : 0;
        const next = base + toFiniteNumber(delta, 0);
        tx.set(cardDocRef, {
            number: next,
            bank_key: keys.bankSha256,
            card_key: keys.cardSha256,
            master_key: keys.masterSha256,
            time_stamp: now
        });
        tx.set(bankDocRef, {
            bank_name: bankName,
            time_stamp: now
        });
        return next;
    });
}

/**
 * Firestoreエラーコードを子供向けの表示キーに変換する。
 * 返り値は translations.json のメッセージIDサフィックス。
 */
export function errorDisplayKey (code) {
    switch (code) {
    case 'unavailable':
    case 'deadline-exceeded':
        return 'offline';
    case 'permission-denied':
    case 'unauthenticated':
        return 'notAllowed';
    default:
        return 'error';
    }
}
