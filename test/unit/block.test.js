import { blockClass } from "../../src/vm/extensions/block/index.js";

describe("blockClass", () => {
    const mockFormatMessage = function (msg) {
        return msg.default;
    };
    // getInfo()内のsetupTranslations()がformatMessage.setup()を呼ぶ
    mockFormatMessage.setup = () => null;
    const runtime = {
        formatMessage: mockFormatMessage
    };

    test("should create an instance of blockClass", () => {
        const block = new blockClass(runtime);
        expect(block).toBeInstanceOf(blockClass);
    });

    test("getInfo() should include existing and new opcodes", () => {
        const block = new blockClass(runtime);
        const info = block.getInfo();
        const opcodes = info.blocks
            .filter(b => typeof b === "object")
            .map(b => b.opcode);

        // 既存ブロック（互換維持）
        for (const opcode of [
            "putNum", "setNum", "getNum", "repNum", "repCloudNum",
            "boolAvl", "setMaster", "lisningNum", "whenUpdated"
        ]) {
            expect(opcodes).toContain(opcode);
        }

        // ACID改善で追加したブロック
        for (const opcode of ["changeNum", "boolLastOpOk", "repLastError"]) {
            expect(opcodes).toContain(opcode);
        }
    });

    test("changeNum block has BANK/CARD/VAL arguments", () => {
        const block = new blockClass(runtime);
        const info = block.getInfo();
        const changeNum = info.blocks.find(b => b.opcode === "changeNum");
        expect(changeNum).toBeDefined();
        expect(Object.keys(changeNum.arguments)).toEqual(
            expect.arrayContaining(["BANK", "CARD", "VAL"])
        );
    });

    test("boolLastOpOk returns true before any operation", () => {
        const block = new blockClass(runtime);
        expect(block.boolLastOpOk({})).toBe(true);
        expect(block.repLastError({})).toBe("");
    });
});
