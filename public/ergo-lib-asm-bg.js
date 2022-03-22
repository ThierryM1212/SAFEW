import * as wasm from './ergo-lib-browser.asm.js';

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
    if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory0;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

            } else {
                state.a = a;
            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_32(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h7abe4d74765217ae(arg0, arg1, addHeapObject(arg2));
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1);
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachegetUint32Memory0 = null;
function getUint32Memory0() {
    if (cachegetUint32Memory0 === null || cachegetUint32Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachegetUint32Memory0;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4);
    getUint32Memory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function getArrayI32FromWasm0(ptr, len) {
    return getInt32Memory0().subarray(ptr / 4, ptr / 4 + len);
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4);
    const mem = getUint32Memory0();
    for (let i = 0; i < array.length; i++) {
        mem[ptr / 4 + i] = addHeapObject(array[i]);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function getArrayJsValueFromWasm0(ptr, len) {
    const mem = getUint32Memory0();
    const slice = mem.subarray(ptr / 4, ptr / 4 + len);
    const result = [];
    for (let i = 0; i < slice.length; i++) {
        result.push(takeObject(slice[i]));
    }
    return result;
}
/**
* GET on /info endpoint
* @param {NodeConf} node
* @returns {Promise<any>}
*/
export function get_info(node) {
    _assertClass(node, NodeConf);
    var ptr0 = node.ptr;
    node.ptr = 0;
    var ret = wasm.get_info(ptr0);
    return takeObject(ret);
}

/**
* Decodes a base16 string into an array of bytes
* @param {string} data
* @returns {Uint8Array}
*/
export function base16_decode(data) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        var ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.base16_decode(retptr, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        var r3 = getInt32Memory0()[retptr / 4 + 3];
        if (r3) {
            throw takeObject(r2);
        }
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* Extracting hints form singed(invalid) Transaction
* @param {Transaction} signed_transaction
* @param {ErgoStateContext} state_context
* @param {ErgoBoxes} boxes_to_spend
* @param {ErgoBoxes} _data_boxes
* @param {Propositions} real_propositions
* @param {Propositions} simulated_propositions
* @returns {TransactionHintsBag}
*/
export function extract_hints(signed_transaction, state_context, boxes_to_spend, _data_boxes, real_propositions, simulated_propositions) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        _assertClass(signed_transaction, Transaction);
        var ptr0 = signed_transaction.ptr;
        signed_transaction.ptr = 0;
        _assertClass(state_context, ErgoStateContext);
        _assertClass(boxes_to_spend, ErgoBoxes);
        _assertClass(_data_boxes, ErgoBoxes);
        _assertClass(real_propositions, Propositions);
        var ptr1 = real_propositions.ptr;
        real_propositions.ptr = 0;
        _assertClass(simulated_propositions, Propositions);
        var ptr2 = simulated_propositions.ptr;
        simulated_propositions.ptr = 0;
        wasm.extract_hints(retptr, ptr0, state_context.ptr, boxes_to_spend.ptr, _data_boxes.ptr, ptr1, ptr2);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        if (r2) {
            throw takeObject(r1);
        }
        return TransactionHintsBag.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
function __wbg_adapter_360(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h6a6c008c6e89f49b(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

/**
* newtype for box registers R4 - R9
*/
export const NonMandatoryRegisterId = Object.freeze({
/**
* id for R4 register
*/
R4:4,"4":"R4",
/**
* id for R5 register
*/
R5:5,"5":"R5",
/**
* id for R6 register
*/
R6:6,"6":"R6",
/**
* id for R7 register
*/
R7:7,"7":"R7",
/**
* id for R8 register
*/
R8:8,"8":"R8",
/**
* id for R9 register
*/
R9:9,"9":"R9", });
/**
* Network type
*/
export const NetworkPrefix = Object.freeze({
/**
* Mainnet
*/
Mainnet:0,"0":"Mainnet",
/**
* Testnet
*/
Testnet:16,"16":"Testnet", });
/**
* Address types
*/
export const AddressTypePrefix = Object.freeze({
/**
* 0x01 - Pay-to-PublicKey(P2PK) address
*/
P2Pk:1,"1":"P2Pk",
/**
* 0x02 - Pay-to-Script-Hash(P2SH)
*/
Pay2Sh:2,"2":"Pay2Sh",
/**
* 0x03 - Pay-to-Script(P2S)
*/
Pay2S:3,"3":"Pay2S", });
/**
*
* * An address is a short string corresponding to some script used to protect a box. Unlike (string-encoded) binary
* * representation of a script, an address has some useful characteristics:
* *
* * - Integrity of an address could be checked., as it is incorporating a checksum.
* * - A prefix of address is showing network and an address type.
* * - An address is using an encoding (namely, Base58) which is avoiding similarly l0Oking characters, friendly to
* * double-clicking and line-breaking in emails.
* *
* *
* *
* * An address is encoding network type, address type, checksum, and enough information to watch for a particular scripts.
* *
* * Possible network types are:
* * Mainnet - 0x00
* * Testnet - 0x10
* *
* * For an address type, we form content bytes as follows:
* *
* * P2PK - serialized (compressed) public key
* * P2SH - first 192 bits of the Blake2b256 hash of serialized script bytes
* * P2S  - serialized script
* *
* * Address examples for testnet:
* *
* * 3   - P2PK (3WvsT2Gm4EpsM9Pg18PdY6XyhNNMqXDsvJTbbf6ihLvAmSb7u5RN)
* * ?   - P2SH (rbcrmKEYduUvADj9Ts3dSVSG27h54pgrq5fPuwB)
* * ?   - P2S (Ms7smJwLGbUAjuWQ)
* *
* * for mainnet:
* *
* * 9  - P2PK (9fRAWhdxEsTcdb8PhGNrZfwqa65zfkuYHAMmkQLcic1gdLSV5vA)
* * ?  - P2SH (8UApt8czfFVuTgQmMwtsRBZ4nfWquNiSwCWUjMg)
* * ?  - P2S (4MQyML64GnzMxZgm, BxKBaHkvrTvLZrDcZjcsxsF7aSsrN73ijeFZXtbj4CXZHHcvBtqSxQ)
* *
* *
* * Prefix byte = network type + address type
* *
* * checksum = blake2b256(prefix byte ++ content bytes)
* *
* * address = prefix byte ++ content bytes ++ checksum
* *
*
*/
export class Address {

    static __wrap(ptr) {
        const obj = Object.create(Address.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_address_free(ptr);
    }
    /**
    * Re-create the address from ErgoTree that was built from the address
    *
    * At some point in the past a user entered an address from which the ErgoTree was built.
    * Re-create the address from this ErgoTree.
    * `tree` - ErgoTree that was created from an Address
    * @param {ErgoTree} ergo_tree
    * @returns {Address}
    */
    static recreate_from_ergo_tree(ergo_tree) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(ergo_tree, ErgoTree);
            wasm.address_recreate_from_ergo_tree(retptr, ergo_tree.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create a P2PK address from serialized PK bytes(EcPoint/GroupElement)
    * @param {Uint8Array} bytes
    * @returns {Address}
    */
    static p2pk_from_pk_bytes(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.address_p2pk_from_pk_bytes(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Decode (base58) testnet address from string, checking that address is from the testnet
    * @param {string} s
    * @returns {Address}
    */
    static from_testnet_str(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.address_from_testnet_str(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Decode (base58) mainnet address from string, checking that address is from the mainnet
    * @param {string} s
    * @returns {Address}
    */
    static from_mainnet_str(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.address_from_mainnet_str(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Decode (base58) address from string without checking the network prefix
    * @param {string} s
    * @returns {Address}
    */
    static from_base58(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.address_from_base58(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Encode (base58) address
    * @param {number} network_prefix
    * @returns {string}
    */
    to_base58(network_prefix) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_to_base58(retptr, this.ptr, network_prefix);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * Decode from a serialized address (that includes the network prefix)
    * @param {Uint8Array} data
    * @returns {Address}
    */
    static from_bytes(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.address_from_bytes(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Encode address as serialized bytes (that includes the network prefix)
    * @param {number} network_prefix
    * @returns {Uint8Array}
    */
    to_bytes(network_prefix) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_to_bytes(retptr, this.ptr, network_prefix);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Get the type of the address
    * @returns {number}
    */
    address_type_prefix() {
        var ret = wasm.address_address_type_prefix(this.ptr);
        return ret >>> 0;
    }
    /**
    * Create an address from a public key
    * @param {Uint8Array} bytes
    * @returns {Address}
    */
    static from_public_key(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.address_from_public_key(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Creates an ErgoTree script from the address
    * @returns {ErgoTree}
    */
    to_ergo_tree() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_to_ergo_tree(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ErgoTree.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Block header
*/
export class BlockHeader {

    static __wrap(ptr) {
        const obj = Object.create(BlockHeader.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_blockheader_free(ptr);
    }
    /**
    * Parse from JSON (Node API)
    * @param {string} json
    * @returns {BlockHeader}
    */
    static from_json(json) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.blockheader_from_json(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return BlockHeader.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Get Header's id
    * @returns {BlockId}
    */
    id() {
        var ret = wasm.blockheader_id(this.ptr);
        return BlockId.__wrap(ret);
    }
}
/**
* Collection of BlockHeaders
*/
export class BlockHeaders {

    static __wrap(ptr) {
        const obj = Object.create(BlockHeaders.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_blockheaders_free(ptr);
    }
    /**
    * parse BlockHeader array from JSON (Node API)
    * @param {any[]} json_vals
    * @returns {BlockHeaders}
    */
    static from_json(json_vals) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArrayJsValueToWasm0(json_vals, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.blockheaders_from_json(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return BlockHeaders.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create new collection with one element
    * @param {BlockHeader} b
    */
    constructor(b) {
        _assertClass(b, BlockHeader);
        var ret = wasm.blockheaders_new(b.ptr);
        return BlockHeaders.__wrap(ret);
    }
    /**
    * Returns the number of elements in the collection
    * @returns {number}
    */
    len() {
        var ret = wasm.blockheaders_len(this.ptr);
        return ret >>> 0;
    }
    /**
    * Add an element to the collection
    * @param {BlockHeader} b
    */
    add(b) {
        _assertClass(b, BlockHeader);
        wasm.blockheaders_add(this.ptr, b.ptr);
    }
    /**
    * Returns the element of the collection with a given index
    * @param {number} index
    * @returns {BlockHeader}
    */
    get(index) {
        var ret = wasm.blockheaders_get(this.ptr, index);
        return BlockHeader.__wrap(ret);
    }
}
/**
* Block id
*/
export class BlockId {

    static __wrap(ptr) {
        const obj = Object.create(BlockId.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_blockid_free(ptr);
    }
}
/**
* Box id (32-byte digest)
*/
export class BoxId {

    static __wrap(ptr) {
        const obj = Object.create(BoxId.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_boxid_free(ptr);
    }
    /**
    * Parse box id (32 byte digest) from base16-encoded string
    * @param {string} box_id_str
    * @returns {BoxId}
    */
    static from_str(box_id_str) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(box_id_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.boxid_from_str(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return BoxId.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Base16 encoded string
    * @returns {string}
    */
    to_str() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.boxid_to_str(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * Returns byte array (32 bytes)
    * @returns {Uint8Array}
    */
    as_bytes() {
        var ret = wasm.boxid_as_bytes(this.ptr);
        return takeObject(ret);
    }
}
/**
* Selected boxes with change boxes (by [`BoxSelector`])
*/
export class BoxSelection {

    static __wrap(ptr) {
        const obj = Object.create(BoxSelection.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_boxselection_free(ptr);
    }
    /**
    * Create a selection to easily inject custom selection algorithms
    * @param {ErgoBoxes} boxes
    * @param {ErgoBoxAssetsDataList} change
    */
    constructor(boxes, change) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(boxes, ErgoBoxes);
            _assertClass(change, ErgoBoxAssetsDataList);
            wasm.boxselection_new(retptr, boxes.ptr, change.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return BoxSelection.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Selected boxes to spend as transaction inputs
    * @returns {ErgoBoxes}
    */
    boxes() {
        var ret = wasm.boxselection_boxes(this.ptr);
        return ErgoBoxes.__wrap(ret);
    }
    /**
    * Selected boxes to use as change
    * @returns {ErgoBoxAssetsDataList}
    */
    change() {
        var ret = wasm.boxselection_change(this.ptr);
        return ErgoBoxAssetsDataList.__wrap(ret);
    }
}
/**
* Box value in nanoERGs with bound checks
*/
export class BoxValue {

    static __wrap(ptr) {
        const obj = Object.create(BoxValue.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_boxvalue_free(ptr);
    }
    /**
    * Recommended (safe) minimal box value to use in case box size estimation is unavailable.
    * Allows box size upto 2777 bytes with current min box value per byte of 360 nanoERGs
    * @returns {BoxValue}
    */
    static SAFE_USER_MIN() {
        var ret = wasm.boxvalue_SAFE_USER_MIN();
        return BoxValue.__wrap(ret);
    }
    /**
    * Number of units inside one ERGO (i.e. one ERG using nano ERG representation)
    * @returns {I64}
    */
    static UNITS_PER_ERGO() {
        var ret = wasm.boxvalue_UNITS_PER_ERGO();
        return I64.__wrap(ret);
    }
    /**
    * Create from i64 with bounds check
    * @param {I64} v
    * @returns {BoxValue}
    */
    static from_i64(v) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(v, I64);
            wasm.boxvalue_from_i64(retptr, v.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return BoxValue.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Get value as signed 64-bit long (I64)
    * @returns {I64}
    */
    as_i64() {
        var ret = wasm.boxvalue_as_i64(this.ptr);
        return I64.__wrap(ret);
    }
    /**
    * big-endian byte array representation
    * @returns {Uint8Array}
    */
    to_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.boxvalue_to_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* CommitmentHint
*/
export class CommitmentHint {

    static __wrap(ptr) {
        const obj = Object.create(CommitmentHint.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_commitmenthint_free(ptr);
    }
}
/**
* Ergo constant(evaluated) values
*/
export class Constant {

    static __wrap(ptr) {
        const obj = Object.create(Constant.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_constant_free(ptr);
    }
    /**
    * Decode from Base16-encoded ErgoTree serialized value
    * @param {string} base16_bytes_str
    * @returns {Constant}
    */
    static decode_from_base16(base16_bytes_str) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(base16_bytes_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.constant_decode_from_base16(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Constant.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Encode as Base16-encoded ErgoTree serialized value or return an error if serialization
    * failed
    * @returns {string}
    */
    encode_to_base16() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.constant_encode_to_base16(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr0 = r0;
            var len0 = r1;
            if (r3) {
                ptr0 = 0; len0 = 0;
                throw takeObject(r2);
            }
            return getStringFromWasm0(ptr0, len0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(ptr0, len0);
        }
    }
    /**
    * Returns serialized bytes or fails with error if Constant cannot be serialized
    * @returns {Uint8Array}
    */
    sigma_serialize_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.constant_sigma_serialize_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create from i32 value
    * @param {number} v
    * @returns {Constant}
    */
    static from_i32(v) {
        var ret = wasm.constant_from_i32(v);
        return Constant.__wrap(ret);
    }
    /**
    * Extract i32 value, returning error if wrong type
    * @returns {number}
    */
    to_i32() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.constant_to_i32(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create from i64
    * @param {I64} v
    * @returns {Constant}
    */
    static from_i64(v) {
        _assertClass(v, I64);
        var ret = wasm.constant_from_i64(v.ptr);
        return Constant.__wrap(ret);
    }
    /**
    * Extract i64 value, returning error if wrong type
    * @returns {I64}
    */
    to_i64() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.constant_to_i64(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create BigInt constant from byte array (signed bytes bit-endian)
    * @param {Uint8Array} num
    * @returns {Constant}
    */
    static from_bigint_signed_bytes_be(num) {
        var ptr0 = passArray8ToWasm0(num, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.constant_from_bigint_signed_bytes_be(ptr0, len0);
        return Constant.__wrap(ret);
    }
    /**
    * Create from byte array
    * @param {Uint8Array} v
    * @returns {Constant}
    */
    static from_byte_array(v) {
        var ptr0 = passArray8ToWasm0(v, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.constant_from_byte_array(ptr0, len0);
        return Constant.__wrap(ret);
    }
    /**
    * Extract byte array, returning error if wrong type
    * @returns {Uint8Array}
    */
    to_byte_array() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.constant_to_byte_array(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create `Coll[Int]` from integer array
    * @param {Int32Array} arr
    * @returns {Constant}
    */
    static from_i32_array(arr) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray32ToWasm0(arr, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.constant_from_i32_array(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Constant.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Extract `Coll[Int]` as integer array
    * @returns {Int32Array}
    */
    to_i32_array() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.constant_to_i32_array(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayI32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create `Coll[Long]` from string array
    * @param {any[]} arr
    * @returns {Constant}
    */
    static from_i64_str_array(arr) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArrayJsValueToWasm0(arr, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.constant_from_i64_str_array(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Constant.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Extract `Coll[Long]` as string array
    * @returns {any[]}
    */
    to_i64_str_array() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.constant_to_i64_str_array(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Extract `Coll[Coll[Byte]]` as array of byte arrays
    * @returns {(Uint8Array)[]}
    */
    to_coll_coll_byte() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.constant_to_coll_coll_byte(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create `Coll[Coll[Byte]]` from array byte array
    * @param {(Uint8Array)[]} arr
    * @returns {Constant}
    */
    static from_coll_coll_byte(arr) {
        var ptr0 = passArrayJsValueToWasm0(arr, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.constant_from_coll_coll_byte(ptr0, len0);
        return Constant.__wrap(ret);
    }
    /**
    * Parse raw [`EcPoint`] value from bytes and make [`ProveDlog`] constant
    * @param {Uint8Array} bytes
    * @returns {Constant}
    */
    static from_ecpoint_bytes(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.constant_from_ecpoint_bytes(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Constant.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Parse raw [`EcPoint`] value from bytes and make [`groupElement`] constant
    * @param {Uint8Array} bytes
    * @returns {Constant}
    */
    static from_ecpoint_bytes_group_element(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.constant_from_ecpoint_bytes_group_element(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Constant.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create `(Coll[Byte], Coll[Byte])` tuple Constant
    * @param {Uint8Array} bytes1
    * @param {Uint8Array} bytes2
    * @returns {Constant}
    */
    static from_tuple_coll_bytes(bytes1, bytes2) {
        var ptr0 = passArray8ToWasm0(bytes1, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passArray8ToWasm0(bytes2, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        var ret = wasm.constant_from_tuple_coll_bytes(ptr0, len0, ptr1, len1);
        return Constant.__wrap(ret);
    }
    /**
    * Extract `(Coll[Byte], Coll[Byte])` tuple from Constant as array of Uint8Array
    * @returns {(Uint8Array)[]}
    */
    to_tuple_coll_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.constant_to_tuple_coll_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create `(Int, Int)` tuple Constant
    * @returns {any[]}
    */
    to_tuple_i32() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.constant_to_tuple_i32(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create `(Long, Long)` tuple Constant
    * @param {I64} l1
    * @param {I64} l2
    * @returns {Constant}
    */
    static from_tuple_i64(l1, l2) {
        _assertClass(l1, I64);
        _assertClass(l2, I64);
        var ret = wasm.constant_from_tuple_i64(l1.ptr, l2.ptr);
        return Constant.__wrap(ret);
    }
    /**
    * Extract `(Long, Long)` tuple from Constant as array of strings
    * @returns {any[]}
    */
    to_tuple_i64() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.constant_to_tuple_i64(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create from ErgoBox value
    * @param {ErgoBox} v
    * @returns {Constant}
    */
    static from_ergo_box(v) {
        _assertClass(v, ErgoBox);
        var ret = wasm.constant_from_ergo_box(v.ptr);
        return Constant.__wrap(ret);
    }
    /**
    * Extract ErgoBox value, returning error if wrong type
    * @returns {ErgoBox}
    */
    to_ergo_box() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.constant_to_ergo_box(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ErgoBox.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* User-defined variables to be put into context
*/
export class ContextExtension {

    static __wrap(ptr) {
        const obj = Object.create(ContextExtension.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_contextextension_free(ptr);
    }
    /**
    * Create new ContextExtension instance
    */
    constructor() {
        var ret = wasm.contextextension_new();
        return ContextExtension.__wrap(ret);
    }
    /**
    * Set the supplied pair in the ContextExtension
    * @param {number} id
    * @param {Constant} value
    */
    set_pair(id, value) {
        _assertClass(value, Constant);
        wasm.contextextension_set_pair(this.ptr, id, value.ptr);
    }
    /**
    * Returns the number of elements in the collection
    * @returns {number}
    */
    len() {
        var ret = wasm.contextextension_len(this.ptr);
        return ret >>> 0;
    }
    /**
    * get from map or fail if key is missing
    * @param {number} key
    * @returns {Constant}
    */
    get(key) {
        var ret = wasm.contextextension_get(this.ptr, key);
        return Constant.__wrap(ret);
    }
    /**
    * Returns all keys in the map
    * @returns {Uint8Array}
    */
    keys() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.contextextension_keys(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns serialized bytes or fails with error if ContextExtension cannot be serialized
    * @returns {Uint8Array}
    */
    sigma_serialize_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.contextextension_sigma_serialize_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Defines the contract(script) that will be guarding box contents
*/
export class Contract {

    static __wrap(ptr) {
        const obj = Object.create(Contract.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_contract_free(ptr);
    }
    /**
    * Create new contract from ErgoTree
    * @param {ErgoTree} ergo_tree
    * @returns {Contract}
    */
    static new(ergo_tree) {
        _assertClass(ergo_tree, ErgoTree);
        var ptr0 = ergo_tree.ptr;
        ergo_tree.ptr = 0;
        var ret = wasm.contract_new(ptr0);
        return Contract.__wrap(ret);
    }
    /**
    * create new contract that allow spending of the guarded box by a given recipient ([`Address`])
    * @param {Address} recipient
    * @returns {Contract}
    */
    static pay_to_address(recipient) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(recipient, Address);
            wasm.contract_pay_to_address(retptr, recipient.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Contract.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Compiles a contract from ErgoScript source code
    * @param {string} source
    * @returns {Contract}
    */
    static compile(source) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.contract_compile(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Contract.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Get the ErgoTree of the contract
    * @returns {ErgoTree}
    */
    ergo_tree() {
        var ret = wasm.contract_ergo_tree(this.ptr);
        return ErgoTree.__wrap(ret);
    }
}
/**
* Inputs, that are used to enrich script context, but won't be spent by the transaction
*/
export class DataInput {

    static __wrap(ptr) {
        const obj = Object.create(DataInput.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_datainput_free(ptr);
    }
    /**
    * Parse box id (32 byte digest) from base16-encoded string
    * @param {BoxId} box_id
    */
    constructor(box_id) {
        _assertClass(box_id, BoxId);
        var ptr0 = box_id.ptr;
        box_id.ptr = 0;
        var ret = wasm.datainput_new(ptr0);
        return DataInput.__wrap(ret);
    }
    /**
    * Get box id
    * @returns {BoxId}
    */
    box_id() {
        var ret = wasm.datainput_box_id(this.ptr);
        return BoxId.__wrap(ret);
    }
}
/**
* DataInput collection
*/
export class DataInputs {

    static __wrap(ptr) {
        const obj = Object.create(DataInputs.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_datainputs_free(ptr);
    }
    /**
    * Create empty DataInputs
    */
    constructor() {
        var ret = wasm.datainputs_new();
        return DataInputs.__wrap(ret);
    }
    /**
    * Returns the number of elements in the collection
    * @returns {number}
    */
    len() {
        var ret = wasm.datainputs_len(this.ptr);
        return ret >>> 0;
    }
    /**
    * Returns the element of the collection with a given index
    * @param {number} index
    * @returns {DataInput}
    */
    get(index) {
        var ret = wasm.datainputs_get(this.ptr, index);
        return DataInput.__wrap(ret);
    }
    /**
    * Adds an elements to the collection
    * @param {DataInput} elem
    */
    add(elem) {
        _assertClass(elem, DataInput);
        wasm.datainputs_add(this.ptr, elem.ptr);
    }
}
/**
* According to
* BIP-44 <https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki>
* and EIP-3 <https://github.com/ergoplatform/eips/blob/master/eip-0003.md>
*/
export class DerivationPath {

    static __wrap(ptr) {
        const obj = Object.create(DerivationPath.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_derivationpath_free(ptr);
    }
    /**
    * Create derivation path for a given account index (hardened) and address indices
    * `m / 44' / 429' / acc' / 0 / address[0] / address[1] / ...`
    * or `m / 44' / 429' / acc' / 0` if address indices are empty
    * change is always zero according to EIP-3
    * acc is expected as a 31-bit value (32th bit should not be set)
    * @param {number} acc
    * @param {Uint32Array} address_indices
    * @returns {DerivationPath}
    */
    static new(acc, address_indices) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray32ToWasm0(address_indices, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.derivationpath_new(retptr, acc, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return DerivationPath.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create root derivation path
    * @returns {DerivationPath}
    */
    static master_path() {
        var ret = wasm.derivationpath_master_path();
        return DerivationPath.__wrap(ret);
    }
    /**
    * Returns the length of the derivation path
    * @returns {number}
    */
    depth() {
        var ret = wasm.derivationpath_depth(this.ptr);
        return ret >>> 0;
    }
    /**
    * Returns a new path with the last element of the deriviation path being increased, e.g. m/1/2 -> m/1/3
    * Returns an empty path error if the path is empty (master node)
    * @returns {DerivationPath}
    */
    next() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.derivationpath_next(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return DerivationPath.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * String representation of derivation path
    * E.g m/44'/429'/0'/0/1
    * @returns {string}
    */
    toString() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.derivationpath_toString(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * Create a derivation path from a formatted string
    * E.g "m/44'/429'/0'/0/1"
    * @param {string} path
    * @returns {DerivationPath}
    */
    static from_string(path) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.derivationpath_from_string(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return DerivationPath.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * For 0x21 Sign Transaction command of Ergo Ledger App Protocol
    * P2PK Sign (0x0D) instruction
    * Sign calculated TX hash with private key for provided BIP44 path.
    * Data:
    *
    * Field
    * Size (B)
    * Description
    *
    * BIP32 path length
    * 1
    * Value: 0x02-0x0A (2-10). Number of path components
    *
    * First derivation index
    * 4
    * Big-endian. Value: 44’
    *
    * Second derivation index
    * 4
    * Big-endian. Value: 429’ (Ergo coin id)
    *
    * Optional Third index
    * 4
    * Big-endian. Any valid bip44 hardened value.
    * ...
    * Optional Last index
    * 4
    * Big-endian. Any valid bip44 value.
    * @returns {Uint8Array}
    */
    ledger_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.derivationpath_ledger_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Ergo box, that is taking part in some transaction on the chain
* Differs with [`ErgoBoxCandidate`] by added transaction id and an index in the input of that transaction
*/
export class ErgoBox {

    static __wrap(ptr) {
        const obj = Object.create(ErgoBox.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ergobox_free(ptr);
    }
    /**
    * make a new box with:
    * `value` - amount of money associated with the box
    * `contract` - guarding contract([`Contract`]), which should be evaluated to true in order
    * to open(spend) this box
    * `creation_height` - height when a transaction containing the box is created.
    * `tx_id` - transaction id in which this box was "created" (participated in outputs)
    * `index` - index (in outputs) in the transaction
    * @param {BoxValue} value
    * @param {number} creation_height
    * @param {Contract} contract
    * @param {TxId} tx_id
    * @param {number} index
    * @param {Tokens} tokens
    */
    constructor(value, creation_height, contract, tx_id, index, tokens) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(value, BoxValue);
            _assertClass(contract, Contract);
            _assertClass(tx_id, TxId);
            _assertClass(tokens, Tokens);
            wasm.ergobox_new(retptr, value.ptr, creation_height, contract.ptr, tx_id.ptr, index, tokens.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ErgoBox.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Get box id
    * @returns {BoxId}
    */
    box_id() {
        var ret = wasm.ergobox_box_id(this.ptr);
        return BoxId.__wrap(ret);
    }
    /**
    * Get box creation height
    * @returns {number}
    */
    creation_height() {
        var ret = wasm.ergobox_creation_height(this.ptr);
        return ret >>> 0;
    }
    /**
    * Get tokens for box
    * @returns {Tokens}
    */
    tokens() {
        var ret = wasm.ergobox_tokens(this.ptr);
        return Tokens.__wrap(ret);
    }
    /**
    * Get ergo tree for box
    * @returns {ErgoTree}
    */
    ergo_tree() {
        var ret = wasm.ergobox_ergo_tree(this.ptr);
        return ErgoTree.__wrap(ret);
    }
    /**
    * Get box value in nanoERGs
    * @returns {BoxValue}
    */
    value() {
        var ret = wasm.ergobox_value(this.ptr);
        return BoxValue.__wrap(ret);
    }
    /**
    * Returns value (ErgoTree constant) stored in the register or None if the register is empty
    * @param {number} register_id
    * @returns {Constant | undefined}
    */
    register_value(register_id) {
        var ret = wasm.ergobox_register_value(this.ptr, register_id);
        return ret === 0 ? undefined : Constant.__wrap(ret);
    }
    /**
    * JSON representation as text (compatible with Ergo Node/Explorer API, numbers are encoded as numbers)
    * @returns {string}
    */
    to_json() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ergobox_to_json(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr0 = r0;
            var len0 = r1;
            if (r3) {
                ptr0 = 0; len0 = 0;
                throw takeObject(r2);
            }
            return getStringFromWasm0(ptr0, len0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(ptr0, len0);
        }
    }
    /**
    * JSON representation according to EIP-12 <https://github.com/ergoplatform/eips/pull/23>
    * (similar to [`Self::to_json`], but as JS object with box value and token amounts encoding as strings)
    * @returns {any}
    */
    to_js_eip12() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ergobox_to_js_eip12(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * parse from JSON
    * supports Ergo Node/Explorer API and box values and token amount encoded as strings
    * @param {string} json
    * @returns {ErgoBox}
    */
    static from_json(json) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.ergobox_from_json(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ErgoBox.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Serialized additional register as defined in ErgoBox serialization (registers count,
    * followed by every non-empyt register value serialized)
    * @returns {Uint8Array}
    */
    serialized_additional_registers() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ergobox_serialized_additional_registers(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns serialized bytes or fails with error if cannot be serialized
    * @returns {Uint8Array}
    */
    sigma_serialize_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ergobox_sigma_serialize_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Parses ErgoBox or fails with error
    * @param {Uint8Array} data
    * @returns {ErgoBox}
    */
    static sigma_parse_bytes(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.ergobox_sigma_parse_bytes(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ErgoBox.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Pair of <value, tokens> for an box
*/
export class ErgoBoxAssetsData {

    static __wrap(ptr) {
        const obj = Object.create(ErgoBoxAssetsData.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ergoboxassetsdata_free(ptr);
    }
    /**
    * Create new instance
    * @param {BoxValue} value
    * @param {Tokens} tokens
    */
    constructor(value, tokens) {
        _assertClass(value, BoxValue);
        _assertClass(tokens, Tokens);
        var ret = wasm.ergoboxassetsdata_new(value.ptr, tokens.ptr);
        return ErgoBoxAssetsData.__wrap(ret);
    }
    /**
    * Value part of the box
    * @returns {BoxValue}
    */
    value() {
        var ret = wasm.ergoboxassetsdata_value(this.ptr);
        return BoxValue.__wrap(ret);
    }
    /**
    * Tokens part of the box
    * @returns {Tokens}
    */
    tokens() {
        var ret = wasm.ergoboxassetsdata_tokens(this.ptr);
        return Tokens.__wrap(ret);
    }
}
/**
* List of asset data for a box
*/
export class ErgoBoxAssetsDataList {

    static __wrap(ptr) {
        const obj = Object.create(ErgoBoxAssetsDataList.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ergoboxassetsdatalist_free(ptr);
    }
    /**
    * Create empty Tokens
    */
    constructor() {
        var ret = wasm.ergoboxassetsdatalist_new();
        return ErgoBoxAssetsDataList.__wrap(ret);
    }
    /**
    * Returns the number of elements in the collection
    * @returns {number}
    */
    len() {
        var ret = wasm.ergoboxassetsdatalist_len(this.ptr);
        return ret >>> 0;
    }
    /**
    * Returns the element of the collection with a given index
    * @param {number} index
    * @returns {ErgoBoxAssetsData}
    */
    get(index) {
        var ret = wasm.ergoboxassetsdatalist_get(this.ptr, index);
        return ErgoBoxAssetsData.__wrap(ret);
    }
    /**
    * Adds an elements to the collection
    * @param {ErgoBoxAssetsData} elem
    */
    add(elem) {
        _assertClass(elem, ErgoBoxAssetsData);
        wasm.ergoboxassetsdatalist_add(this.ptr, elem.ptr);
    }
}
/**
* ErgoBox candidate not yet included in any transaction on the chain
*/
export class ErgoBoxCandidate {

    static __wrap(ptr) {
        const obj = Object.create(ErgoBoxCandidate.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ergoboxcandidate_free(ptr);
    }
    /**
    * Create a box with miner's contract and given value
    * @param {BoxValue} fee_amount
    * @param {number} creation_height
    * @returns {ErgoBoxCandidate}
    */
    static new_miner_fee_box(fee_amount, creation_height) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(fee_amount, BoxValue);
            wasm.ergoboxcandidate_new_miner_fee_box(retptr, fee_amount.ptr, creation_height);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ErgoBoxCandidate.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns value (ErgoTree constant) stored in the register or None if the register is empty
    * @param {number} register_id
    * @returns {Constant | undefined}
    */
    register_value(register_id) {
        var ret = wasm.ergoboxcandidate_register_value(this.ptr, register_id);
        return ret === 0 ? undefined : Constant.__wrap(ret);
    }
    /**
    * Get box creation height
    * @returns {number}
    */
    creation_height() {
        var ret = wasm.ergoboxcandidate_creation_height(this.ptr);
        return ret >>> 0;
    }
    /**
    * Get tokens for box
    * @returns {Tokens}
    */
    tokens() {
        var ret = wasm.ergoboxcandidate_tokens(this.ptr);
        return Tokens.__wrap(ret);
    }
    /**
    * Get ergo tree for box
    * @returns {ErgoTree}
    */
    ergo_tree() {
        var ret = wasm.ergoboxcandidate_ergo_tree(this.ptr);
        return ErgoTree.__wrap(ret);
    }
    /**
    * Get box value in nanoERGs
    * @returns {BoxValue}
    */
    value() {
        var ret = wasm.ergoboxcandidate_value(this.ptr);
        return BoxValue.__wrap(ret);
    }
}
/**
* ErgoBoxCandidate builder
*/
export class ErgoBoxCandidateBuilder {

    static __wrap(ptr) {
        const obj = Object.create(ErgoBoxCandidateBuilder.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ergoboxcandidatebuilder_free(ptr);
    }
    /**
    * Create builder with required box parameters:
    * `value` - amount of money associated with the box
    * `contract` - guarding contract([`Contract`]), which should be evaluated to true in order
    * to open(spend) this box
    * `creation_height` - height when a transaction containing the box is created.
    * It should not exceed height of the block, containing the transaction with this box.
    * @param {BoxValue} value
    * @param {Contract} contract
    * @param {number} creation_height
    */
    constructor(value, contract, creation_height) {
        _assertClass(value, BoxValue);
        _assertClass(contract, Contract);
        var ret = wasm.ergoboxcandidatebuilder_new(value.ptr, contract.ptr, creation_height);
        return ErgoBoxCandidateBuilder.__wrap(ret);
    }
    /**
    * Set minimal value (per byte of the serialized box size)
    * @param {number} new_min_value_per_byte
    */
    set_min_box_value_per_byte(new_min_value_per_byte) {
        wasm.ergoboxcandidatebuilder_set_min_box_value_per_byte(this.ptr, new_min_value_per_byte);
    }
    /**
    * Get minimal value (per byte of the serialized box size)
    * @returns {number}
    */
    min_box_value_per_byte() {
        var ret = wasm.ergoboxcandidatebuilder_min_box_value_per_byte(this.ptr);
        return ret >>> 0;
    }
    /**
    * Set new box value
    * @param {BoxValue} new_value
    */
    set_value(new_value) {
        _assertClass(new_value, BoxValue);
        var ptr0 = new_value.ptr;
        new_value.ptr = 0;
        wasm.ergoboxcandidatebuilder_set_value(this.ptr, ptr0);
    }
    /**
    * Get box value
    * @returns {BoxValue}
    */
    value() {
        var ret = wasm.ergoboxcandidatebuilder_value(this.ptr);
        return BoxValue.__wrap(ret);
    }
    /**
    * Calculate serialized box size(in bytes)
    * @returns {number}
    */
    calc_box_size_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ergoboxcandidatebuilder_calc_box_size_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0 >>> 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Calculate minimal box value for the current box serialized size(in bytes)
    * @returns {BoxValue}
    */
    calc_min_box_value() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ergoboxcandidatebuilder_calc_min_box_value(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return BoxValue.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Set register with a given id (R4-R9) to the given value
    * @param {number} register_id
    * @param {Constant} value
    */
    set_register_value(register_id, value) {
        _assertClass(value, Constant);
        wasm.ergoboxcandidatebuilder_set_register_value(this.ptr, register_id, value.ptr);
    }
    /**
    * Returns register value for the given register id (R4-R9), or None if the register is empty
    * @param {number} register_id
    * @returns {Constant | undefined}
    */
    register_value(register_id) {
        var ret = wasm.ergoboxcandidatebuilder_register_value(this.ptr, register_id);
        return ret === 0 ? undefined : Constant.__wrap(ret);
    }
    /**
    * Delete register value(make register empty) for the given register id (R4-R9)
    * @param {number} register_id
    */
    delete_register_value(register_id) {
        wasm.ergoboxcandidatebuilder_delete_register_value(this.ptr, register_id);
    }
    /**
    * Mint token, as defined in <https://github.com/ergoplatform/eips/blob/master/eip-0004.md>
    * `token` - token id(box id of the first input box in transaction) and token amount,
    * `token_name` - token name (will be encoded in R4),
    * `token_desc` - token description (will be encoded in R5),
    * `num_decimals` - number of decimals (will be encoded in R6)
    * @param {Token} token
    * @param {string} token_name
    * @param {string} token_desc
    * @param {number} num_decimals
    */
    mint_token(token, token_name, token_desc, num_decimals) {
        _assertClass(token, Token);
        var ptr0 = passStringToWasm0(token_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passStringToWasm0(token_desc, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        wasm.ergoboxcandidatebuilder_mint_token(this.ptr, token.ptr, ptr0, len0, ptr1, len1, num_decimals);
    }
    /**
    * Add given token id and token amount
    * @param {TokenId} token_id
    * @param {TokenAmount} amount
    */
    add_token(token_id, amount) {
        _assertClass(token_id, TokenId);
        _assertClass(amount, TokenAmount);
        wasm.ergoboxcandidatebuilder_add_token(this.ptr, token_id.ptr, amount.ptr);
    }
    /**
    * Build the box candidate
    * @returns {ErgoBoxCandidate}
    */
    build() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ergoboxcandidatebuilder_build(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ErgoBoxCandidate.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Collection of ErgoBoxCandidates
*/
export class ErgoBoxCandidates {

    static __wrap(ptr) {
        const obj = Object.create(ErgoBoxCandidates.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ergoboxcandidates_free(ptr);
    }
    /**
    * Create new outputs
    * @param {ErgoBoxCandidate} box_candidate
    */
    constructor(box_candidate) {
        _assertClass(box_candidate, ErgoBoxCandidate);
        var ret = wasm.ergoboxcandidates_new(box_candidate.ptr);
        return ErgoBoxCandidates.__wrap(ret);
    }
    /**
    * sometimes it's useful to keep track of an empty list
    * but keep in mind Ergo transactions need at least 1 output
    * @returns {ErgoBoxCandidates}
    */
    static empty() {
        var ret = wasm.ergoboxcandidates_empty();
        return ErgoBoxCandidates.__wrap(ret);
    }
    /**
    * Returns the number of elements in the collection
    * @returns {number}
    */
    len() {
        var ret = wasm.ergoboxcandidates_len(this.ptr);
        return ret >>> 0;
    }
    /**
    * Returns the element of the collection with a given index
    * @param {number} index
    * @returns {ErgoBoxCandidate}
    */
    get(index) {
        var ret = wasm.ergoboxcandidates_get(this.ptr, index);
        return ErgoBoxCandidate.__wrap(ret);
    }
    /**
    * Add an element to the collection
    * @param {ErgoBoxCandidate} b
    */
    add(b) {
        _assertClass(b, ErgoBoxCandidate);
        wasm.ergoboxcandidates_add(this.ptr, b.ptr);
    }
}
/**
* Collection of ErgoBox'es
*/
export class ErgoBoxes {

    static __wrap(ptr) {
        const obj = Object.create(ErgoBoxes.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ergoboxes_free(ptr);
    }
    /**
    * parse ErgoBox array from json
    * @param {any[]} json_vals
    * @returns {ErgoBoxes}
    */
    static from_boxes_json(json_vals) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArrayJsValueToWasm0(json_vals, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.ergoboxes_from_boxes_json(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ErgoBoxes.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create new collection with one element
    * @param {ErgoBox} b
    */
    constructor(b) {
        _assertClass(b, ErgoBox);
        var ret = wasm.ergoboxes_new(b.ptr);
        return ErgoBoxes.__wrap(ret);
    }
    /**
    * Returns the number of elements in the collection
    * @returns {number}
    */
    len() {
        var ret = wasm.ergoboxes_len(this.ptr);
        return ret >>> 0;
    }
    /**
    * Add an element to the collection
    * @param {ErgoBox} b
    */
    add(b) {
        _assertClass(b, ErgoBox);
        wasm.ergoboxes_add(this.ptr, b.ptr);
    }
    /**
    * Returns the element of the collection with a given index
    * @param {number} index
    * @returns {ErgoBox}
    */
    get(index) {
        var ret = wasm.ergoboxes_get(this.ptr, index);
        return ErgoBox.__wrap(ret);
    }
    /**
    * Empty ErgoBoxes
    * @returns {ErgoBoxes}
    */
    static empty() {
        var ret = wasm.ergoboxes_empty();
        return ErgoBoxes.__wrap(ret);
    }
}
/**
* Blockchain state (last headers, etc.)
*/
export class ErgoStateContext {

    static __wrap(ptr) {
        const obj = Object.create(ErgoStateContext.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ergostatecontext_free(ptr);
    }
    /**
    * Create new context from pre-header
    * @param {PreHeader} pre_header
    * @param {BlockHeaders} headers
    */
    constructor(pre_header, headers) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(pre_header, PreHeader);
            var ptr0 = pre_header.ptr;
            pre_header.ptr = 0;
            _assertClass(headers, BlockHeaders);
            var ptr1 = headers.ptr;
            headers.ptr = 0;
            wasm.ergostatecontext_new(retptr, ptr0, ptr1);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ErgoStateContext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* The root of ErgoScript IR. Serialized instances of this class are self sufficient and can be passed around.
*/
export class ErgoTree {

    static __wrap(ptr) {
        const obj = Object.create(ErgoTree.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ergotree_free(ptr);
    }
    /**
    * Decode from base16 encoded serialized ErgoTree
    * @param {string} s
    * @returns {ErgoTree}
    */
    static from_base16_bytes(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.ergotree_from_base16_bytes(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ErgoTree.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Decode from encoded serialized ErgoTree
    * @param {Uint8Array} data
    * @returns {ErgoTree}
    */
    static from_bytes(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.ergotree_from_bytes(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ErgoTree.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns serialized bytes or fails with error if ErgoTree cannot be serialized
    * @returns {Uint8Array}
    */
    sigma_serialize_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ergotree_sigma_serialize_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns Base16-encoded serialized bytes
    * @returns {string}
    */
    to_base16_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ergotree_to_base16_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr0 = r0;
            var len0 = r1;
            if (r3) {
                ptr0 = 0; len0 = 0;
                throw takeObject(r2);
            }
            return getStringFromWasm0(ptr0, len0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(ptr0, len0);
        }
    }
    /**
    * Returns constants number as stored in serialized ErgoTree or error if the parsing of
    * constants is failed
    * @returns {number}
    */
    constants_len() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ergotree_constants_len(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0 >>> 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns constant with given index (as stored in serialized ErgoTree)
    * or None if index is out of bounds
    * or error if constants parsing were failed
    * @param {number} index
    * @returns {Constant | undefined}
    */
    get_constant(index) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ergotree_get_constant(retptr, this.ptr, index);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0 === 0 ? undefined : Constant.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Consumes the calling ErgoTree and returns new ErgoTree with a new constant value
    * for a given index in constants list (as stored in serialized ErgoTree), or an error.
    * After the call the calling ErgoTree will be null.
    * @param {number} index
    * @param {Constant} constant
    * @returns {ErgoTree}
    */
    with_constant(index, constant) {
        try {
            const ptr = this.__destroy_into_raw();
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(constant, Constant);
            wasm.ergotree_with_constant(retptr, ptr, index, constant.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ErgoTree.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Serialized proposition expression of SigmaProp type with
    * ConstantPlaceholder nodes instead of Constant nodes
    * @returns {Uint8Array}
    */
    template_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ergotree_template_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Extented public key implemented according to BIP-32
*/
export class ExtPubKey {

    static __wrap(ptr) {
        const obj = Object.create(ExtPubKey.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_extpubkey_free(ptr);
    }
    /**
    * Create ExtPubKey from public key bytes (from SEC1 compressed), chain code and derivation
    * path
    * @param {Uint8Array} public_key_bytes
    * @param {Uint8Array} chain_code
    * @param {DerivationPath} derivation_path
    * @returns {ExtPubKey}
    */
    static new(public_key_bytes, chain_code, derivation_path) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(public_key_bytes, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = passArray8ToWasm0(chain_code, wasm.__wbindgen_malloc);
            var len1 = WASM_VECTOR_LEN;
            _assertClass(derivation_path, DerivationPath);
            wasm.extpubkey_new(retptr, ptr0, len0, ptr1, len1, derivation_path.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ExtPubKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Soft derivation of the child public key with a given index
    * index is expected to be a 31-bit value(32th bit should not be set)
    * @param {number} index
    * @returns {ExtPubKey}
    */
    child(index) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.extpubkey_child(retptr, this.ptr, index);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ExtPubKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Derive a new extended pub key from the derivation path
    * @param {DerivationPath} path
    * @returns {ExtPubKey}
    */
    derive(path) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(path, DerivationPath);
            var ptr0 = path.ptr;
            path.ptr = 0;
            wasm.extpubkey_derive(retptr, this.ptr, ptr0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ExtPubKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create address (P2PK) from this extended public key
    * @returns {Address}
    */
    to_address() {
        var ret = wasm.extpubkey_to_address(this.ptr);
        return Address.__wrap(ret);
    }
}
/**
* Extented secret key implemented according to BIP-32
*/
export class ExtSecretKey {

    static __wrap(ptr) {
        const obj = Object.create(ExtSecretKey.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_extsecretkey_free(ptr);
    }
    /**
    * Create ExtSecretKey from secret key bytes, chain code and derivation path
    * @param {Uint8Array} secret_key_bytes
    * @param {Uint8Array} chain_code
    * @param {DerivationPath} derivation_path
    * @returns {ExtSecretKey}
    */
    static new(secret_key_bytes, chain_code, derivation_path) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(secret_key_bytes, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = passArray8ToWasm0(chain_code, wasm.__wbindgen_malloc);
            var len1 = WASM_VECTOR_LEN;
            _assertClass(derivation_path, DerivationPath);
            wasm.extsecretkey_new(retptr, ptr0, len0, ptr1, len1, derivation_path.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ExtSecretKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Derive root extended secret key
    * @param {Uint8Array} seed_bytes
    * @returns {ExtSecretKey}
    */
    static derive_master(seed_bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(seed_bytes, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.extsecretkey_derive_master(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ExtSecretKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Derive a new extended secret key from the provided index
    * The index is in the form of soft or hardened indices
    * For example: 4 or 4' respectively
    * @param {string} index
    * @returns {ExtSecretKey}
    */
    child(index) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(index, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.extsecretkey_child(retptr, this.ptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ExtSecretKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Derive a new extended secret key from the derivation path
    * @param {DerivationPath} path
    * @returns {ExtSecretKey}
    */
    derive(path) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(path, DerivationPath);
            var ptr0 = path.ptr;
            path.ptr = 0;
            wasm.extsecretkey_derive(retptr, this.ptr, ptr0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ExtSecretKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * The bytes of the associated secret key
    * @returns {Uint8Array}
    */
    secret_key_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.extsecretkey_secret_key_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * The extended public key associated with this secret key
    * @returns {ExtPubKey}
    */
    public_key() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.extsecretkey_public_key(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ExtPubKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Derivation path associated with the ext secret key
    * @returns {DerivationPath}
    */
    path() {
        var ret = wasm.extsecretkey_path(this.ptr);
        return DerivationPath.__wrap(ret);
    }
}
/**
* HintsBag
*/
export class HintsBag {

    static __wrap(ptr) {
        const obj = Object.create(HintsBag.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_hintsbag_free(ptr);
    }
    /**
    * Empty HintsBag
    * @returns {HintsBag}
    */
    static empty() {
        var ret = wasm.hintsbag_empty();
        return HintsBag.__wrap(ret);
    }
    /**
    * Add commitment hint to the bag
    * @param {CommitmentHint} hint
    */
    add_commitment(hint) {
        _assertClass(hint, CommitmentHint);
        var ptr0 = hint.ptr;
        hint.ptr = 0;
        wasm.hintsbag_add_commitment(this.ptr, ptr0);
    }
    /**
    * Length of HintsBag
    * @returns {number}
    */
    len() {
        var ret = wasm.hintsbag_len(this.ptr);
        return ret >>> 0;
    }
    /**
    * Get commitment
    * @param {number} index
    * @returns {CommitmentHint}
    */
    get(index) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.hintsbag_get(retptr, this.ptr, index);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return CommitmentHint.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Wrapper for i64 for JS/TS
*/
export class I64 {

    static __wrap(ptr) {
        const obj = Object.create(I64.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_i64_free(ptr);
    }
    /**
    * Create from a standard rust string representation
    * @param {string} string
    * @returns {I64}
    */
    static from_str(string) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.i64_from_str(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * String representation of the value for use from environments that don't support i64
    * @returns {string}
    */
    to_str() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_to_str(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * Get the value as JS number (64-bit float)
    * @returns {number}
    */
    as_num() {
        var ret = wasm.i64_as_num(this.ptr);
        return takeObject(ret);
    }
    /**
    * Addition with overflow check
    * @param {I64} other
    * @returns {I64}
    */
    checked_add(other) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(other, I64);
            wasm.i64_checked_add(retptr, this.ptr, other.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Signed inputs used in signed transactions
*/
export class Input {

    static __wrap(ptr) {
        const obj = Object.create(Input.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_input_free(ptr);
    }
    /**
    * Get box id
    * @returns {BoxId}
    */
    box_id() {
        var ret = wasm.input_box_id(this.ptr);
        return BoxId.__wrap(ret);
    }
    /**
    * Get the spending proof
    * @returns {ProverResult}
    */
    spending_proof() {
        var ret = wasm.input_spending_proof(this.ptr);
        return ProverResult.__wrap(ret);
    }
}
/**
* Collection of signed inputs
*/
export class Inputs {

    static __wrap(ptr) {
        const obj = Object.create(Inputs.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_inputs_free(ptr);
    }
    /**
    * Create empty Inputs
    */
    constructor() {
        var ret = wasm.inputs_new();
        return Inputs.__wrap(ret);
    }
    /**
    * Returns the number of elements in the collection
    * @returns {number}
    */
    len() {
        var ret = wasm.inputs_len(this.ptr);
        return ret >>> 0;
    }
    /**
    * Returns the element of the collection with a given index
    * @param {number} index
    * @returns {Input}
    */
    get(index) {
        var ret = wasm.inputs_get(this.ptr, index);
        return Input.__wrap(ret);
    }
}
/**
* A level node in a merkle proof
*/
export class LevelNode {

    static __wrap(ptr) {
        const obj = Object.create(LevelNode.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_levelnode_free(ptr);
    }
    /**
    * Creates a new LevelNode from a 32 byte hash and side that the node belongs on in the tree. Fails if the digest is not 32 bytes
    * @param {Uint8Array} hash
    * @param {number} side
    * @returns {LevelNode}
    */
    static new(hash, side) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(hash, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.levelnode_new(retptr, ptr0, len0, side);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return LevelNode.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns the associated digest (hash) with this node
    * @returns {Uint8Array}
    */
    get digest() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.levelnode_digest(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns the associated side with this node (0 = Left, 1 = Right)
    * @returns {number}
    */
    get side() {
        var ret = wasm.levelnode_side(this.ptr);
        return ret;
    }
}
/**
* A MerkleProof type. Given leaf data and levels (bottom-upwards), the root hash can be computed and validated
*/
export class MerkleProof {

    static __wrap(ptr) {
        const obj = Object.create(MerkleProof.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_merkleproof_free(ptr);
    }
    /**
    * Creates a new merkle proof with given leaf data and level data (bottom-upwards)
    * You can verify it against a Blakeb256 root hash by using [`Self::valid()`]
    * Add a node by using [`Self::add_node()`]
    * Each digest on the level must be exactly 32 bytes
    * @param {Uint8Array} leaf_data
    * @returns {MerkleProof}
    */
    static new(leaf_data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(leaf_data, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.merkleproof_new(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return MerkleProof.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Adds a new node to the MerkleProof above the current nodes
    * @param {LevelNode} level
    */
    add_node(level) {
        _assertClass(level, LevelNode);
        wasm.merkleproof_add_node(this.ptr, level.ptr);
    }
    /**
    * Validates the Merkle proof against the root hash
    * @param {Uint8Array} expected_root
    * @returns {boolean}
    */
    valid(expected_root) {
        var ptr0 = passArray8ToWasm0(expected_root, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.merkleproof_valid(this.ptr, ptr0, len0);
        return ret !== 0;
    }
}
/**
* helper methods to get the fee address for various networks
*/
export class MinerAddress {

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mineraddress_free(ptr);
    }
    /**
    * address to use in mainnet for the fee
    * @returns {string}
    */
    static mainnet_fee_address() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.mineraddress_mainnet_fee_address(retptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * address to use in testnet for the fee
    * @returns {string}
    */
    static testnet_fee_address() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.mineraddress_testnet_fee_address(retptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
}
/**
* Mnemonic
*/
export class Mnemonic {

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mnemonic_free(ptr);
    }
    /**
    * Convert a mnemonic phrase into a mnemonic seed
    * mnemonic_pass is optional and is used to salt the seed
    * @param {string} mnemonic_phrase
    * @param {string} mnemonic_pass
    * @returns {Uint8Array}
    */
    static to_seed(mnemonic_phrase, mnemonic_pass) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(mnemonic_phrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = passStringToWasm0(mnemonic_pass, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            wasm.mnemonic_to_seed(retptr, ptr0, len0, ptr1, len1);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v2 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Combination of an Address with a network
* These two combined together form a base58 encoding
*/
export class NetworkAddress {

    static __wrap(ptr) {
        const obj = Object.create(NetworkAddress.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_networkaddress_free(ptr);
    }
    /**
    * create a new NetworkAddress(address + network prefix) for a given network type
    * @param {number} network
    * @param {Address} address
    * @returns {NetworkAddress}
    */
    static new(network, address) {
        _assertClass(address, Address);
        var ret = wasm.networkaddress_new(network, address.ptr);
        return NetworkAddress.__wrap(ret);
    }
    /**
    * Decode (base58) a NetworkAddress (address + network prefix) from string
    * @param {string} s
    * @returns {NetworkAddress}
    */
    static from_base58(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.networkaddress_from_base58(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return NetworkAddress.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Encode (base58) address
    * @returns {string}
    */
    to_base58() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.networkaddress_to_base58(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * Decode from a serialized address
    * @param {Uint8Array} data
    * @returns {NetworkAddress}
    */
    static from_bytes(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.networkaddress_from_bytes(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return NetworkAddress.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Encode address as serialized bytes
    * @returns {Uint8Array}
    */
    to_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.networkaddress_to_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Network for the address
    * @returns {number}
    */
    network() {
        var ret = wasm.networkaddress_network(this.ptr);
        return ret >>> 0;
    }
    /**
    * Get address without network information
    * @returns {Address}
    */
    address() {
        var ret = wasm.networkaddress_address(this.ptr);
        return Address.__wrap(ret);
    }
}
/**
* A structure representing NiPoPow proof.
*/
export class NipopowProof {

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_nipopowproof_free(ptr);
    }
}
/**
* A verifier for PoPoW proofs. During its lifetime, it processes many proofs with the aim of
* deducing at any given point what is the best (sub)chain rooted at the specified genesis.
*/
export class NipopowVerifier {

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_nipopowverifier_free(ptr);
    }
}
/**
* Node configuration
*/
export class NodeConf {

    static __wrap(ptr) {
        const obj = Object.create(NodeConf.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_nodeconf_free(ptr);
    }
    /**
    * Create a node configuration
    * addr - a string in a format 'ip_address:port'
    * @param {string} addr
    */
    constructor(addr) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(addr, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.nodeconf_new(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return NodeConf.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Block header with the current `spendingTransaction`, that can be predicted
* by a miner before it's formation
*/
export class PreHeader {

    static __wrap(ptr) {
        const obj = Object.create(PreHeader.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_preheader_free(ptr);
    }
    /**
    * Create using data from block header
    * @param {BlockHeader} block_header
    * @returns {PreHeader}
    */
    static from_block_header(block_header) {
        _assertClass(block_header, BlockHeader);
        var ptr0 = block_header.ptr;
        block_header.ptr = 0;
        var ret = wasm.preheader_from_block_header(ptr0);
        return PreHeader.__wrap(ret);
    }
}
/**
* Propositions list(public keys)
*/
export class Propositions {

    static __wrap(ptr) {
        const obj = Object.create(Propositions.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_propositions_free(ptr);
    }
    /**
    * Create empty proposition holder
    */
    constructor() {
        var ret = wasm.propositions_new();
        return Propositions.__wrap(ret);
    }
    /**
    * Adding new proposition
    * @param {Uint8Array} proposition
    */
    add_proposition_from_byte(proposition) {
        var ptr0 = passArray8ToWasm0(proposition, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.propositions_add_proposition_from_byte(this.ptr, ptr0, len0);
    }
}
/**
* Proof of correctness of tx spending
*/
export class ProverResult {

    static __wrap(ptr) {
        const obj = Object.create(ProverResult.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_proverresult_free(ptr);
    }
    /**
    * Get proof
    * @returns {Uint8Array}
    */
    proof() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.proverresult_proof(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Get extension
    * @returns {ContextExtension}
    */
    extension() {
        var ret = wasm.proverresult_extension(this.ptr);
        return ContextExtension.__wrap(ret);
    }
    /**
    * JSON representation as text (compatible with Ergo Node/Explorer API, numbers are encoded as numbers)
    * @returns {string}
    */
    to_json() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.proverresult_to_json(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr0 = r0;
            var len0 = r1;
            if (r3) {
                ptr0 = 0; len0 = 0;
                throw takeObject(r2);
            }
            return getStringFromWasm0(ptr0, len0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(ptr0, len0);
        }
    }
}
/**
* Represent `reduced` transaction, i.e. unsigned transaction where each unsigned input
* is augmented with ReducedInput which contains a script reduction result.
* After an unsigned transaction is reduced it can be signed without context.
* Thus, it can be serialized and transferred for example to Cold Wallet and signed
* in an environment where secrets are known.
* see EIP-19 for more details -
* <https://github.com/ergoplatform/eips/blob/f280890a4163f2f2e988a0091c078e36912fc531/eip-0019.md>
*/
export class ReducedTransaction {

    static __wrap(ptr) {
        const obj = Object.create(ReducedTransaction.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_reducedtransaction_free(ptr);
    }
    /**
    * Returns `reduced` transaction, i.e. unsigned transaction where each unsigned input
    * is augmented with ReducedInput which contains a script reduction result.
    * @param {UnsignedTransaction} unsigned_tx
    * @param {ErgoBoxes} boxes_to_spend
    * @param {ErgoBoxes} data_boxes
    * @param {ErgoStateContext} state_context
    * @returns {ReducedTransaction}
    */
    static from_unsigned_tx(unsigned_tx, boxes_to_spend, data_boxes, state_context) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(unsigned_tx, UnsignedTransaction);
            _assertClass(boxes_to_spend, ErgoBoxes);
            _assertClass(data_boxes, ErgoBoxes);
            _assertClass(state_context, ErgoStateContext);
            wasm.reducedtransaction_from_unsigned_tx(retptr, unsigned_tx.ptr, boxes_to_spend.ptr, data_boxes.ptr, state_context.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ReducedTransaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns serialized bytes or fails with error if cannot be serialized
    * @returns {Uint8Array}
    */
    sigma_serialize_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.reducedtransaction_sigma_serialize_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Parses ReducedTransaction or fails with error
    * @param {Uint8Array} data
    * @returns {ReducedTransaction}
    */
    static sigma_parse_bytes(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.reducedtransaction_sigma_parse_bytes(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return ReducedTransaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns the unsigned transaction
    * @returns {UnsignedTransaction}
    */
    unsigned_tx() {
        var ret = wasm.reducedtransaction_unsigned_tx(this.ptr);
        return UnsignedTransaction.__wrap(ret);
    }
}
/**
* Secret key for the prover
*/
export class SecretKey {

    static __wrap(ptr) {
        const obj = Object.create(SecretKey.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_secretkey_free(ptr);
    }
    /**
    * generate random key
    * @returns {SecretKey}
    */
    static random_dlog() {
        var ret = wasm.secretkey_random_dlog();
        return SecretKey.__wrap(ret);
    }
    /**
    * Parse dlog secret key from bytes (SEC-1-encoded scalar)
    * @param {Uint8Array} bytes
    * @returns {SecretKey}
    */
    static dlog_from_bytes(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.secretkey_dlog_from_bytes(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return SecretKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Address (encoded public image)
    * @returns {Address}
    */
    get_address() {
        var ret = wasm.secretkey_get_address(this.ptr);
        return Address.__wrap(ret);
    }
    /**
    * Encode from a serialized key
    * @returns {Uint8Array}
    */
    to_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.secretkey_to_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* SecretKey collection
*/
export class SecretKeys {

    static __wrap(ptr) {
        const obj = Object.create(SecretKeys.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_secretkeys_free(ptr);
    }
    /**
    * Create empty SecretKeys
    */
    constructor() {
        var ret = wasm.secretkeys_new();
        return SecretKeys.__wrap(ret);
    }
    /**
    * Returns the number of elements in the collection
    * @returns {number}
    */
    len() {
        var ret = wasm.secretkeys_len(this.ptr);
        return ret >>> 0;
    }
    /**
    * Returns the element of the collection with a given index
    * @param {number} index
    * @returns {SecretKey}
    */
    get(index) {
        var ret = wasm.secretkeys_get(this.ptr, index);
        return SecretKey.__wrap(ret);
    }
    /**
    * Adds an elements to the collection
    * @param {SecretKey} elem
    */
    add(elem) {
        _assertClass(elem, SecretKey);
        wasm.secretkeys_add(this.ptr, elem.ptr);
    }
}
/**
* Naive box selector, collects inputs until target balance is reached
*/
export class SimpleBoxSelector {

    static __wrap(ptr) {
        const obj = Object.create(SimpleBoxSelector.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_simpleboxselector_free(ptr);
    }
    /**
    * Create empty SimpleBoxSelector
    */
    constructor() {
        var ret = wasm.simpleboxselector_new();
        return SimpleBoxSelector.__wrap(ret);
    }
    /**
    * Selects inputs to satisfy target balance and tokens.
    * `inputs` - available inputs (returns an error, if empty),
    * `target_balance` - coins (in nanoERGs) needed,
    * `target_tokens` - amount of tokens needed.
    * Returns selected inputs and box assets(value+tokens) with change.
    * @param {ErgoBoxes} inputs
    * @param {BoxValue} target_balance
    * @param {Tokens} target_tokens
    * @returns {BoxSelection}
    */
    select(inputs, target_balance, target_tokens) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(inputs, ErgoBoxes);
            _assertClass(target_balance, BoxValue);
            _assertClass(target_tokens, Tokens);
            wasm.simpleboxselector_select(retptr, this.ptr, inputs.ptr, target_balance.ptr, target_tokens.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return BoxSelection.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Token represented with token id paired with it's amount
*/
export class Token {

    static __wrap(ptr) {
        const obj = Object.create(Token.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_token_free(ptr);
    }
    /**
    * Create a token with given token id and amount
    * @param {TokenId} token_id
    * @param {TokenAmount} amount
    */
    constructor(token_id, amount) {
        _assertClass(token_id, TokenId);
        _assertClass(amount, TokenAmount);
        var ret = wasm.token_new(token_id.ptr, amount.ptr);
        return Token.__wrap(ret);
    }
    /**
    * Get token id
    * @returns {TokenId}
    */
    id() {
        var ret = wasm.token_id(this.ptr);
        return TokenId.__wrap(ret);
    }
    /**
    * Get token amount
    * @returns {TokenAmount}
    */
    amount() {
        var ret = wasm.token_amount(this.ptr);
        return TokenAmount.__wrap(ret);
    }
    /**
    * JSON representation as text (compatible with Ergo Node/Explorer API, numbers are encoded as numbers)
    * @returns {string}
    */
    to_json() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.token_to_json(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr0 = r0;
            var len0 = r1;
            if (r3) {
                ptr0 = 0; len0 = 0;
                throw takeObject(r2);
            }
            return getStringFromWasm0(ptr0, len0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(ptr0, len0);
        }
    }
    /**
    * JSON representation according to EIP-12 <https://github.com/ergoplatform/eips/pull/23>
    * (similar to [`Self::to_json`], but as JS object with token amount encoding as string)
    * @returns {any}
    */
    to_js_eip12() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.token_to_js_eip12(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Token amount with bound checks
*/
export class TokenAmount {

    static __wrap(ptr) {
        const obj = Object.create(TokenAmount.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tokenamount_free(ptr);
    }
    /**
    * Create from i64 with bounds check
    * @param {I64} v
    * @returns {TokenAmount}
    */
    static from_i64(v) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(v, I64);
            wasm.tokenamount_from_i64(retptr, v.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return TokenAmount.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Get value as signed 64-bit long (I64)
    * @returns {I64}
    */
    as_i64() {
        var ret = wasm.tokenamount_as_i64(this.ptr);
        return I64.__wrap(ret);
    }
    /**
    * big-endian byte array representation
    * @returns {Uint8Array}
    */
    to_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.tokenamount_to_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Token id (32 byte digest)
*/
export class TokenId {

    static __wrap(ptr) {
        const obj = Object.create(TokenId.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tokenid_free(ptr);
    }
    /**
    * Create token id from ergo box id (32 byte digest)
    * @param {BoxId} box_id
    * @returns {TokenId}
    */
    static from_box_id(box_id) {
        _assertClass(box_id, BoxId);
        var ret = wasm.tokenid_from_box_id(box_id.ptr);
        return TokenId.__wrap(ret);
    }
    /**
    * Parse token id (32 byte digest) from base16-encoded string
    * @param {string} str
    * @returns {TokenId}
    */
    static from_str(str) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.tokenid_from_str(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return TokenId.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Base16 encoded string
    * @returns {string}
    */
    to_str() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.tokenid_to_str(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * Returns byte array (32 bytes)
    * @returns {Uint8Array}
    */
    as_bytes() {
        var ret = wasm.tokenid_as_bytes(this.ptr);
        return takeObject(ret);
    }
}
/**
* Array of tokens
*/
export class Tokens {

    static __wrap(ptr) {
        const obj = Object.create(Tokens.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tokens_free(ptr);
    }
    /**
    * Create empty Tokens
    */
    constructor() {
        var ret = wasm.tokens_new();
        return Tokens.__wrap(ret);
    }
    /**
    * Returns the number of elements in the collection
    * @returns {number}
    */
    len() {
        var ret = wasm.tokens_len(this.ptr);
        return ret >>> 0;
    }
    /**
    * Returns the element of the collection with a given index
    * @param {number} index
    * @returns {Token}
    */
    get(index) {
        var ret = wasm.tokens_get(this.ptr, index);
        return Token.__wrap(ret);
    }
    /**
    * Adds an elements to the collection
    * @param {Token} elem
    */
    add(elem) {
        _assertClass(elem, Token);
        wasm.tokens_add(this.ptr, elem.ptr);
    }
}
/**
*
* * ErgoTransaction is an atomic state transition operation. It destroys Boxes from the state
* * and creates new ones. If transaction is spending boxes protected by some non-trivial scripts,
* * its inputs should also contain proof of spending correctness - context extension (user-defined
* * key-value map) and data inputs (links to existing boxes in the state) that may be used during
* * script reduction to crypto, signatures that satisfies the remaining cryptographic protection
* * of the script.
* * Transactions are not encrypted, so it is possible to browse and view every transaction ever
* * collected into a block.
*
*/
export class Transaction {

    static __wrap(ptr) {
        const obj = Object.create(Transaction.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transaction_free(ptr);
    }
    /**
    * Create Transaction from UnsignedTransaction and an array of proofs in the same order as
    * UnsignedTransaction.inputs with empty proof indicated with empty byte array
    * @param {UnsignedTransaction} unsigned_tx
    * @param {(Uint8Array)[]} proofs
    * @returns {Transaction}
    */
    static from_unsigned_tx(unsigned_tx, proofs) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(unsigned_tx, UnsignedTransaction);
            var ptr0 = unsigned_tx.ptr;
            unsigned_tx.ptr = 0;
            var ptr1 = passArrayJsValueToWasm0(proofs, wasm.__wbindgen_malloc);
            var len1 = WASM_VECTOR_LEN;
            wasm.transaction_from_unsigned_tx(retptr, ptr0, ptr1, len1);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Transaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Get id for transaction
    * @returns {TxId}
    */
    id() {
        var ret = wasm.transaction_id(this.ptr);
        return TxId.__wrap(ret);
    }
    /**
    * JSON representation as text (compatible with Ergo Node/Explorer API, numbers are encoded as numbers)
    * @returns {string}
    */
    to_json() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_to_json(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr0 = r0;
            var len0 = r1;
            if (r3) {
                ptr0 = 0; len0 = 0;
                throw takeObject(r2);
            }
            return getStringFromWasm0(ptr0, len0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(ptr0, len0);
        }
    }
    /**
    * JSON representation according to EIP-12 <https://github.com/ergoplatform/eips/pull/23>
    * (similar to [`Self::to_json`], but as JS object with box value and token amount encoding as strings)
    * @returns {any}
    */
    to_js_eip12() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_to_js_eip12(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * parse from JSON
    * supports Ergo Node/Explorer API and box values and token amount encoded as strings
    * @param {string} json
    * @returns {Transaction}
    */
    static from_json(json) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.transaction_from_json(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Transaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Inputs for transaction
    * @returns {Inputs}
    */
    inputs() {
        var ret = wasm.transaction_inputs(this.ptr);
        return Inputs.__wrap(ret);
    }
    /**
    * Data inputs for transaction
    * @returns {DataInputs}
    */
    data_inputs() {
        var ret = wasm.transaction_data_inputs(this.ptr);
        return DataInputs.__wrap(ret);
    }
    /**
    * Output candidates for transaction
    * @returns {ErgoBoxCandidates}
    */
    output_candidates() {
        var ret = wasm.transaction_output_candidates(this.ptr);
        return ErgoBoxCandidates.__wrap(ret);
    }
    /**
    * Returns ErgoBox's created from ErgoBoxCandidate's with tx id and indices
    * @returns {ErgoBoxes}
    */
    outputs() {
        var ret = wasm.transaction_outputs(this.ptr);
        return ErgoBoxes.__wrap(ret);
    }
    /**
    * Returns serialized bytes or fails with error if cannot be serialized
    * @returns {Uint8Array}
    */
    sigma_serialize_bytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_sigma_serialize_bytes(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Parses Transaction or fails with error
    * @param {Uint8Array} data
    * @returns {Transaction}
    */
    static sigma_parse_bytes(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.transaction_sigma_parse_bytes(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Transaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* TransactionHintsBag
*/
export class TransactionHintsBag {

    static __wrap(ptr) {
        const obj = Object.create(TransactionHintsBag.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionhintsbag_free(ptr);
    }
    /**
    * Empty TransactionHintsBag
    * @returns {TransactionHintsBag}
    */
    static empty() {
        var ret = wasm.transactionhintsbag_empty();
        return TransactionHintsBag.__wrap(ret);
    }
    /**
    * Adding hints for input
    * @param {number} index
    * @param {HintsBag} hints_bag
    */
    add_hints_for_input(index, hints_bag) {
        _assertClass(hints_bag, HintsBag);
        wasm.transactionhintsbag_add_hints_for_input(this.ptr, index, hints_bag.ptr);
    }
    /**
    * Outputting HintsBag corresponding for an input index
    * @param {number} index
    * @returns {HintsBag}
    */
    all_hints_for_input(index) {
        var ret = wasm.transactionhintsbag_all_hints_for_input(this.ptr, index);
        return HintsBag.__wrap(ret);
    }
}
/**
* Unsigned transaction builder
*/
export class TxBuilder {

    static __wrap(ptr) {
        const obj = Object.create(TxBuilder.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_txbuilder_free(ptr);
    }
    /**
    * Suggested transaction fee (semi-default value used across wallets and dApps as of Oct 2020)
    * @returns {BoxValue}
    */
    static SUGGESTED_TX_FEE() {
        var ret = wasm.txbuilder_SUGGESTED_TX_FEE();
        return BoxValue.__wrap(ret);
    }
    /**
    * Creates new TxBuilder
    * `box_selection` - selected input boxes (via [`super::box_selector`])
    * `output_candidates` - output boxes to be "created" in this transaction,
    * `current_height` - chain height that will be used in additionally created boxes (change, miner's fee, etc.),
    * `fee_amount` - miner's fee,
    * `change_address` - change (inputs - outputs) will be sent to this address,
    * `min_change_value` - minimal value of the change to be sent to `change_address`, value less than that
    * will be given to miners,
    * @param {BoxSelection} box_selection
    * @param {ErgoBoxCandidates} output_candidates
    * @param {number} current_height
    * @param {BoxValue} fee_amount
    * @param {Address} change_address
    * @param {BoxValue} min_change_value
    * @returns {TxBuilder}
    */
    static new(box_selection, output_candidates, current_height, fee_amount, change_address, min_change_value) {
        _assertClass(box_selection, BoxSelection);
        _assertClass(output_candidates, ErgoBoxCandidates);
        _assertClass(fee_amount, BoxValue);
        _assertClass(change_address, Address);
        _assertClass(min_change_value, BoxValue);
        var ret = wasm.txbuilder_new(box_selection.ptr, output_candidates.ptr, current_height, fee_amount.ptr, change_address.ptr, min_change_value.ptr);
        return TxBuilder.__wrap(ret);
    }
    /**
    * Set transaction's data inputs
    * @param {DataInputs} data_inputs
    */
    set_data_inputs(data_inputs) {
        _assertClass(data_inputs, DataInputs);
        wasm.txbuilder_set_data_inputs(this.ptr, data_inputs.ptr);
    }
    /**
    * Build the unsigned transaction
    * @returns {UnsignedTransaction}
    */
    build() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.txbuilder_build(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return UnsignedTransaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Get box selection
    * @returns {BoxSelection}
    */
    box_selection() {
        var ret = wasm.txbuilder_box_selection(this.ptr);
        return BoxSelection.__wrap(ret);
    }
    /**
    * Get data inputs
    * @returns {DataInputs}
    */
    data_inputs() {
        var ret = wasm.txbuilder_data_inputs(this.ptr);
        return DataInputs.__wrap(ret);
    }
    /**
    * Get outputs EXCLUDING fee and change
    * @returns {ErgoBoxCandidates}
    */
    output_candidates() {
        var ret = wasm.txbuilder_output_candidates(this.ptr);
        return ErgoBoxCandidates.__wrap(ret);
    }
    /**
    * Get current height
    * @returns {number}
    */
    current_height() {
        var ret = wasm.txbuilder_current_height(this.ptr);
        return ret >>> 0;
    }
    /**
    * Get fee amount
    * @returns {BoxValue}
    */
    fee_amount() {
        var ret = wasm.txbuilder_fee_amount(this.ptr);
        return BoxValue.__wrap(ret);
    }
    /**
    * Get change address
    * @returns {Address}
    */
    change_address() {
        var ret = wasm.txbuilder_change_address(this.ptr);
        return Address.__wrap(ret);
    }
    /**
    * Get min change value
    * @returns {BoxValue}
    */
    min_change_value() {
        var ret = wasm.txbuilder_min_change_value(this.ptr);
        return BoxValue.__wrap(ret);
    }
}
/**
* Transaction id
*/
export class TxId {

    static __wrap(ptr) {
        const obj = Object.create(TxId.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_txid_free(ptr);
    }
    /**
    * Zero (empty) transaction id (to use as dummy value in tests)
    * @returns {TxId}
    */
    static zero() {
        var ret = wasm.txid_zero();
        return TxId.__wrap(ret);
    }
    /**
    * get the tx id as bytes
    * @returns {string}
    */
    to_str() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.txid_to_str(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * convert a hex string into a TxId
    * @param {string} s
    * @returns {TxId}
    */
    static from_str(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.txid_from_str(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return TxId.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* Unsigned inputs used in constructing unsigned transactions
*/
export class UnsignedInput {

    static __wrap(ptr) {
        const obj = Object.create(UnsignedInput.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_unsignedinput_free(ptr);
    }
    /**
    * Create new unsigned input instance from box id and extension
    * @param {BoxId} box_id
    * @param {ContextExtension} ext
    */
    constructor(box_id, ext) {
        _assertClass(box_id, BoxId);
        _assertClass(ext, ContextExtension);
        var ret = wasm.unsignedinput_new(box_id.ptr, ext.ptr);
        return UnsignedInput.__wrap(ret);
    }
    /**
    * Create a new unsigned input from the provided box id
    * using an empty context extension
    * @param {BoxId} box_id
    * @returns {UnsignedInput}
    */
    static from_box_id(box_id) {
        _assertClass(box_id, BoxId);
        var ret = wasm.unsignedinput_from_box_id(box_id.ptr);
        return UnsignedInput.__wrap(ret);
    }
    /**
    * Get box id
    * @returns {BoxId}
    */
    box_id() {
        var ret = wasm.unsignedinput_box_id(this.ptr);
        return BoxId.__wrap(ret);
    }
    /**
    * Get extension
    * @returns {ContextExtension}
    */
    extension() {
        var ret = wasm.unsignedinput_extension(this.ptr);
        return ContextExtension.__wrap(ret);
    }
}
/**
* Collection of unsigned signed inputs
*/
export class UnsignedInputs {

    static __wrap(ptr) {
        const obj = Object.create(UnsignedInputs.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_unsignedinputs_free(ptr);
    }
    /**
    * Create empty UnsignedInputs
    */
    constructor() {
        var ret = wasm.unsignedinputs_new();
        return UnsignedInputs.__wrap(ret);
    }
    /**
    * Returns the number of elements in the collection
    * @returns {number}
    */
    len() {
        var ret = wasm.unsignedinputs_len(this.ptr);
        return ret >>> 0;
    }
    /**
    * Returns the element of the collection with a given index
    * @param {number} index
    * @returns {UnsignedInput}
    */
    get(index) {
        var ret = wasm.unsignedinputs_get(this.ptr, index);
        return UnsignedInput.__wrap(ret);
    }
    /**
    * Add an element to the collection
    * @param {UnsignedInput} b
    */
    add(b) {
        _assertClass(b, UnsignedInput);
        wasm.unsignedinputs_add(this.ptr, b.ptr);
    }
}
/**
* Unsigned (inputs without proofs) transaction
*/
export class UnsignedTransaction {

    static __wrap(ptr) {
        const obj = Object.create(UnsignedTransaction.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_unsignedtransaction_free(ptr);
    }
    /**
    * Create a new unsigned transaction
    * @param {UnsignedInputs} inputs
    * @param {DataInputs} data_inputs
    * @param {ErgoBoxCandidates} output_candidates
    */
    constructor(inputs, data_inputs, output_candidates) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(inputs, UnsignedInputs);
            _assertClass(data_inputs, DataInputs);
            _assertClass(output_candidates, ErgoBoxCandidates);
            wasm.unsignedtransaction_new(retptr, inputs.ptr, data_inputs.ptr, output_candidates.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return UnsignedTransaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Consumes the calling UnsignedTransaction and returns a new UnsignedTransaction containing
    * the ContextExtension in the provided input box id or returns an error if the input box cannot be found.
    * After the call the calling UnsignedTransaction will be null.
    * @param {BoxId} input_id
    * @param {ContextExtension} ext
    * @returns {UnsignedTransaction}
    */
    with_input_context_ext(input_id, ext) {
        try {
            const ptr = this.__destroy_into_raw();
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(input_id, BoxId);
            _assertClass(ext, ContextExtension);
            wasm.unsignedtransaction_with_input_context_ext(retptr, ptr, input_id.ptr, ext.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return UnsignedTransaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Get id for transaction
    * @returns {TxId}
    */
    id() {
        var ret = wasm.unsignedtransaction_id(this.ptr);
        return TxId.__wrap(ret);
    }
    /**
    * Inputs for transaction
    * @returns {UnsignedInputs}
    */
    inputs() {
        var ret = wasm.unsignedtransaction_inputs(this.ptr);
        return UnsignedInputs.__wrap(ret);
    }
    /**
    * Data inputs for transaction
    * @returns {DataInputs}
    */
    data_inputs() {
        var ret = wasm.unsignedtransaction_data_inputs(this.ptr);
        return DataInputs.__wrap(ret);
    }
    /**
    * Output candidates for transaction
    * @returns {ErgoBoxCandidates}
    */
    output_candidates() {
        var ret = wasm.unsignedtransaction_output_candidates(this.ptr);
        return ErgoBoxCandidates.__wrap(ret);
    }
    /**
    * JSON representation as text (compatible with Ergo Node/Explorer API, numbers are encoded as numbers)
    * @returns {string}
    */
    to_json() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.unsignedtransaction_to_json(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr0 = r0;
            var len0 = r1;
            if (r3) {
                ptr0 = 0; len0 = 0;
                throw takeObject(r2);
            }
            return getStringFromWasm0(ptr0, len0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(ptr0, len0);
        }
    }
    /**
    * JSON representation according to EIP-12 <https://github.com/ergoplatform/eips/pull/23>
    * (similar to [`Self::to_json`], but as JS object with box value and token amount encoding as strings)
    * @returns {any}
    */
    to_js_eip12() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.unsignedtransaction_to_js_eip12(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * parse from JSON
    * supports Ergo Node/Explorer API and box values and token amount encoded as strings
    * @param {string} json
    * @returns {UnsignedTransaction}
    */
    static from_json(json) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.unsignedtransaction_from_json(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return UnsignedTransaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns distinct token id from output_candidates as array of byte arrays
    * @returns {(Uint8Array)[]}
    */
    distinct_token_ids() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.unsignedtransaction_distinct_token_ids(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
* A collection of secret keys. This simplified signing by matching the secret keys to the correct inputs automatically.
*/
export class Wallet {

    static __wrap(ptr) {
        const obj = Object.create(Wallet.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wallet_free(ptr);
    }
    /**
    * Create wallet instance loading secret key from mnemonic
    * Returns None if a DlogSecretKey cannot be parsed from the provided phrase
    * @param {string} mnemonic_phrase
    * @param {string} mnemonic_pass
    * @returns {Wallet | undefined}
    */
    static from_mnemonic(mnemonic_phrase, mnemonic_pass) {
        var ptr0 = passStringToWasm0(mnemonic_phrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passStringToWasm0(mnemonic_pass, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        var ret = wasm.wallet_from_mnemonic(ptr0, len0, ptr1, len1);
        return ret === 0 ? undefined : Wallet.__wrap(ret);
    }
    /**
    * Create wallet using provided secret key
    * @param {SecretKeys} secret
    * @returns {Wallet}
    */
    static from_secrets(secret) {
        _assertClass(secret, SecretKeys);
        var ret = wasm.wallet_from_secrets(secret.ptr);
        return Wallet.__wrap(ret);
    }
    /**
    * Add a secret to the wallets prover
    * @param {SecretKey} secret
    */
    add_secret(secret) {
        _assertClass(secret, SecretKey);
        wasm.wallet_add_secret(this.ptr, secret.ptr);
    }
    /**
    * Sign a transaction:
    * `tx` - transaction to sign
    * `boxes_to_spend` - boxes corresponding to [`UnsignedTransaction::inputs`]
    * `data_boxes` - boxes corresponding to [`UnsignedTransaction::data_inputs`]
    * @param {ErgoStateContext} _state_context
    * @param {UnsignedTransaction} tx
    * @param {ErgoBoxes} boxes_to_spend
    * @param {ErgoBoxes} data_boxes
    * @returns {Transaction}
    */
    sign_transaction(_state_context, tx, boxes_to_spend, data_boxes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(_state_context, ErgoStateContext);
            _assertClass(tx, UnsignedTransaction);
            _assertClass(boxes_to_spend, ErgoBoxes);
            _assertClass(data_boxes, ErgoBoxes);
            wasm.wallet_sign_transaction(retptr, this.ptr, _state_context.ptr, tx.ptr, boxes_to_spend.ptr, data_boxes.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Transaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Sign a multi signature transaction:
    * `tx` - transaction to sign
    * `boxes_to_spend` - boxes corresponding to [`UnsignedTransaction::inputs`]
    * `data_boxes` - boxes corresponding to [`UnsignedTransaction::data_inputs`]
    * `tx_hints` - transaction hints bag corresponding to [`TransactionHintsBag`]
    * @param {ErgoStateContext} _state_context
    * @param {UnsignedTransaction} tx
    * @param {ErgoBoxes} boxes_to_spend
    * @param {ErgoBoxes} data_boxes
    * @param {TransactionHintsBag} tx_hints
    * @returns {Transaction}
    */
    sign_transaction_multi(_state_context, tx, boxes_to_spend, data_boxes, tx_hints) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(_state_context, ErgoStateContext);
            _assertClass(tx, UnsignedTransaction);
            _assertClass(boxes_to_spend, ErgoBoxes);
            _assertClass(data_boxes, ErgoBoxes);
            _assertClass(tx_hints, TransactionHintsBag);
            wasm.wallet_sign_transaction_multi(retptr, this.ptr, _state_context.ptr, tx.ptr, boxes_to_spend.ptr, data_boxes.ptr, tx_hints.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Transaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Sign a transaction:
    * `reduced_tx` - reduced transaction, i.e. unsigned transaction where for each unsigned input
    * added a script reduction result.
    * @param {ReducedTransaction} reduced_tx
    * @returns {Transaction}
    */
    sign_reduced_transaction(reduced_tx) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(reduced_tx, ReducedTransaction);
            wasm.wallet_sign_reduced_transaction(retptr, this.ptr, reduced_tx.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Transaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Sign a multi signature reduced transaction:
    * `reduced_tx` - reduced transaction, i.e. unsigned transaction where for each unsigned input
    * added a script reduction result.
    * `tx_hints` - transaction hints bag corresponding to [`TransactionHintsBag`]
    * @param {ReducedTransaction} reduced_tx
    * @param {TransactionHintsBag} tx_hints
    * @returns {Transaction}
    */
    sign_reduced_transaction_multi(reduced_tx, tx_hints) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(reduced_tx, ReducedTransaction);
            _assertClass(tx_hints, TransactionHintsBag);
            wasm.wallet_sign_reduced_transaction_multi(retptr, this.ptr, reduced_tx.ptr, tx_hints.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Transaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Generate Commitments for unsigned tx
    * @param {ErgoStateContext} _state_context
    * @param {UnsignedTransaction} tx
    * @param {ErgoBoxes} boxes_to_spend
    * @param {ErgoBoxes} data_boxes
    * @returns {TransactionHintsBag}
    */
    generate_commitments(_state_context, tx, boxes_to_spend, data_boxes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(_state_context, ErgoStateContext);
            _assertClass(tx, UnsignedTransaction);
            _assertClass(boxes_to_spend, ErgoBoxes);
            _assertClass(data_boxes, ErgoBoxes);
            wasm.wallet_generate_commitments(retptr, this.ptr, _state_context.ptr, tx.ptr, boxes_to_spend.ptr, data_boxes.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return TransactionHintsBag.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Generate Commitments for reduced Transaction
    * @param {ReducedTransaction} reduced_tx
    * @returns {TransactionHintsBag}
    */
    generate_commitments_for_reduced_transaction(reduced_tx) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(reduced_tx, ReducedTransaction);
            wasm.wallet_generate_commitments_for_reduced_transaction(retptr, this.ptr, reduced_tx.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return TransactionHintsBag.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbindgen_number_new(arg0) {
    var ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_string_new(arg0, arg1) {
    var ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_json_parse(arg0, arg1) {
    var ret = JSON.parse(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbindgen_json_serialize(arg0, arg1) {
    const obj = getObject(arg1);
    var ret = JSON.stringify(obj === undefined ? null : obj);
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_is_string(arg0) {
    var ret = typeof(getObject(arg0)) === 'string';
    return ret;
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = getObject(arg1);
    var ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_object_clone_ref(arg0) {
    var ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbg_fetch_fb26f738d9707b16(arg0) {
    var ret = fetch(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbindgen_cb_drop(arg0) {
    const obj = takeObject(arg0).original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    var ret = false;
    return ret;
};

export function __wbg_fetch_fe54824ee845f6b4(arg0, arg1) {
    var ret = getObject(arg0).fetch(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_new_226d109446575877() { return handleError(function () {
    var ret = new Headers();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_append_4d85f35672cbffa7() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_instanceof_Response_ea36d565358a42f7(arg0) {
    var ret = getObject(arg0) instanceof Response;
    return ret;
};

export function __wbg_url_6e564c9e212456f8(arg0, arg1) {
    var ret = getObject(arg1).url;
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_status_3a55bb50e744b834(arg0) {
    var ret = getObject(arg0).status;
    return ret;
};

export function __wbg_headers_e4204c6775f7b3b4(arg0) {
    var ret = getObject(arg0).headers;
    return addHeapObject(ret);
};

export function __wbg_arrayBuffer_0e2a43f68a8b3e49() { return handleError(function (arg0) {
    var ret = getObject(arg0).arrayBuffer();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_newwithstrandinit_c07f0662ece15bc6() { return handleError(function (arg0, arg1, arg2) {
    var ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_getRandomValues_3e46aa268da0fed1() { return handleError(function (arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
}, arguments) };

export function __wbg_randomFillSync_59fcc2add91fe7b3() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_process_f2b73829dbd321da(arg0) {
    var ret = getObject(arg0).process;
    return addHeapObject(ret);
};

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    var ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbg_versions_cd82f79c98672a9f(arg0) {
    var ret = getObject(arg0).versions;
    return addHeapObject(ret);
};

export function __wbg_node_ee3f6da4130bd35f(arg0) {
    var ret = getObject(arg0).node;
    return addHeapObject(ret);
};

export function __wbg_modulerequire_0a83c0c31d12d2c7() { return handleError(function (arg0, arg1) {
    var ret = module.require(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_crypto_9e3521ed42436d35(arg0) {
    var ret = getObject(arg0).crypto;
    return addHeapObject(ret);
};

export function __wbg_msCrypto_c429c3f8f7a70bb5(arg0) {
    var ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
};

export function __wbindgen_is_function(arg0) {
    var ret = typeof(getObject(arg0)) === 'function';
    return ret;
};

export function __wbg_newnoargs_f579424187aa1717(arg0, arg1) {
    var ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_next_c7a2a6b012059a5e(arg0) {
    var ret = getObject(arg0).next;
    return addHeapObject(ret);
};

export function __wbg_next_dd1a890d37e38d73() { return handleError(function (arg0) {
    var ret = getObject(arg0).next();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_done_982b1c7ac0cbc69d(arg0) {
    var ret = getObject(arg0).done;
    return ret;
};

export function __wbg_value_2def2d1fb38b02cd(arg0) {
    var ret = getObject(arg0).value;
    return addHeapObject(ret);
};

export function __wbg_iterator_4b9cedbeda0c0e30() {
    var ret = Symbol.iterator;
    return addHeapObject(ret);
};

export function __wbg_get_8bbb82393651dd9c() { return handleError(function (arg0, arg1) {
    var ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_89558c3e96703ca1() { return handleError(function (arg0, arg1) {
    var ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_d3138911a89329b0() {
    var ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_new_55259b13834a484c(arg0, arg1) {
    var ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_call_94697a95cb7e239c() { return handleError(function (arg0, arg1, arg2) {
    var ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_4beacc9c71572250(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_360(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        var ret = new Promise(cb0);
        return addHeapObject(ret);
    } finally {
        state0.a = state0.b = 0;
    }
};

export function __wbg_resolve_4f8f547f26b30b27(arg0) {
    var ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_then_a6860c82b90816ca(arg0, arg1) {
    var ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_then_58a04e42527f52c6(arg0, arg1, arg2) {
    var ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_self_e23d74ae45fb17d1() { return handleError(function () {
    var ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_b4be7f48b24ac56e() { return handleError(function () {
    var ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_d61b1f48a57191ae() { return handleError(function () {
    var ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_e7669da72fd7f239() { return handleError(function () {
    var ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_is_undefined(arg0) {
    var ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbg_buffer_5e74a88a1424a2e0(arg0) {
    var ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_278ec7532799393a(arg0, arg1, arg2) {
    var ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_new_e3b800e570795b3c(arg0) {
    var ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_5b8081e9d002f0df(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_30803400a8f15c59(arg0) {
    var ret = getObject(arg0).length;
    return ret;
};

export function __wbg_newwithlength_5f4ce114a24dfe1e(arg0) {
    var ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_subarray_a68f835ca2af506f(arg0, arg1, arg2) {
    var ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_has_3850edde6df9191b() { return handleError(function (arg0, arg1) {
    var ret = Reflect.has(getObject(arg0), getObject(arg1));
    return ret;
}, arguments) };

export function __wbg_set_c42875065132a932() { return handleError(function (arg0, arg1, arg2) {
    var ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
}, arguments) };

export function __wbg_stringify_f8bfc9e2d1e8b6a0() { return handleError(function (arg0) {
    var ret = JSON.stringify(getObject(arg0));
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_debug_string(arg0, arg1) {
    var ret = debugString(getObject(arg1));
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_memory() {
    var ret = wasm.memory;
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper5021(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 839, __wbg_adapter_32);
    return addHeapObject(ret);
};

