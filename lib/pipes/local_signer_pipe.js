/**
 * @file dev_pipe.js
 * @fileOverview Base class for the dev-pipe.
 * @author Andreas Olofsson (andreas@erisindustries.com)
 * @module pipe/dev_pipe
 */
'use strict';

var Pipe = require('./pipe');
var nUtil = require('util');

module.exports = LSPipe;

/**
 * DevPipe transacts using the unsafe
 *
 * @param {*} erisdb - the erisdb object.
 * @param {Function} signerFunc - should accept a TxPayload object and turn it into a signed transaction.
 *
 * @constructor
 */
function LSPipe(erisdb, signerFunc) {
    Pipe.call(this, erisdb);
    this._signerFunc = signerFunc;
}

nUtil.inherits(LSPipe, Pipe);

/**
 * Used to send a transaction.
 * @param {module:solidity/function~TxPayload} txPayload - The payload object.
 * @param callback - The error-first callback.
 */
LSPipe.prototype.transact = function (txPayload, callback) {
    console.log("Calling pipe transact function");
    var that = this;
    var txObj = this._signerFunc(txPayload, function (error, data) {
        if (error) {
            callback(error);
            return;
        }
        that._erisdb.txs().broadcastTx(txObj, function (error, data) {
            if (error) {
                callback(error);
                return;
            }
            var txRet = data;
            var eventSub;
            that._erisdb.events().subNewBlocks(function (error, data) {
                if (error) {
                    callback(error);
                    return;
                }
                eventSub = data;
            }, function (error, data) {
                // We don't care about the block data, just the fact that a new block event was fired.
                if (error) {
                    callback(error);
                }
                eventSub.stop(function () {
                    callback(null, txRet);
                });
            });
        });
    });
};