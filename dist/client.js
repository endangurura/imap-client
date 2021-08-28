function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

import { map, pipe, union, zip, fromPairs, propOr, pathOr, flatten } from 'ramda';
import { imapEncode, imapDecode } from 'emailjs-utf7';
import { parseAPPEND, parseCOPY, parseNAMESPACE, parseSELECT, parseFETCH, parseSEARCH, parseSTATUS } from './command-parser';
import { buildFETCHCommand, buildXOAuth2Token, buildSEARCHCommand, buildSTORECommand } from './command-builder';
import createDefaultLogger from './logger';
import ImapClient from './imap';
import { LOG_LEVEL_ERROR, LOG_LEVEL_WARN, LOG_LEVEL_INFO, LOG_LEVEL_DEBUG, LOG_LEVEL_ALL } from './common';
import { checkSpecialUse } from './special-use';
export var TIMEOUT_CONNECTION = 90 * 1000; // Milliseconds to wait for the IMAP greeting from the server

export var TIMEOUT_NOOP = 60 * 1000; // Milliseconds between NOOP commands while idling

export var TIMEOUT_IDLE = 60 * 1000; // Milliseconds until IDLE command is cancelled

export var STATE_CONNECTING = 1;
export var STATE_NOT_AUTHENTICATED = 2;
export var STATE_AUTHENTICATED = 3;
export var STATE_SELECTED = 4;
export var STATE_LOGOUT = 5;
export var DEFAULT_CLIENT_ID = {
  name: 'emailjs-imap-client'
};
/**
 * emailjs IMAP client
 *
 * @constructor
 *
 * @param {String} [host='localhost'] Hostname to conenct to
 * @param {Number} [port=143] Port number to connect to
 * @param {Object} [options] Optional options object
 */

var Client = /*#__PURE__*/function () {
  function Client(host, port) {
    var _this = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, Client);

    this.timeoutConnection = TIMEOUT_CONNECTION;
    this.timeoutNoop = TIMEOUT_NOOP;
    this.timeoutIdle = TIMEOUT_IDLE;
    this.serverId = false; // RFC 2971 Server ID as key value pairs
    // Event placeholders

    this.oncert = null;
    this.onupdate = null;
    this.onselectmailbox = null;
    this.onclosemailbox = null;
    this._host = host;
    this._clientId = propOr(DEFAULT_CLIENT_ID, 'id', options);
    this._state = false; // Current state

    this._authenticated = false; // Is the connection authenticated

    this._capability = []; // List of extensions the server supports

    this._selectedMailbox = false; // Selected mailbox

    this._enteredIdle = false;
    this._idleTimeout = false;
    this._enableCompression = !!options.enableCompression;
    this._auth = options.auth;
    this._requireTLS = !!options.requireTLS;
    this._ignoreTLS = !!options.ignoreTLS;
    this.client = new ImapClient(host, port, options); // IMAP client object
    // Event Handlers

    this.client.onerror = this._onError.bind(this);

    this.client.oncert = function (cert) {
      return _this.oncert && _this.oncert(cert);
    }; // allows certificate handling for platforms w/o native tls support


    this.client.onidle = function () {
      return _this._onIdle();
    }; // start idling
    // Default handlers for untagged responses


    this.client.setHandler('capability', function (response) {
      return _this._untaggedCapabilityHandler(response);
    }); // capability updates

    this.client.setHandler('ok', function (response) {
      return _this._untaggedOkHandler(response);
    }); // notifications

    this.client.setHandler('exists', function (response) {
      return _this._untaggedExistsHandler(response);
    }); // message count has changed

    this.client.setHandler('expunge', function (response) {
      return _this._untaggedExpungeHandler(response);
    }); // message has been deleted

    this.client.setHandler('fetch', function (response) {
      return _this._untaggedFetchHandler(response);
    }); // message has been updated (eg. flag change)
    // Activate logging

    this.createLogger();
    this.logLevel = propOr(LOG_LEVEL_ALL, 'logLevel', options);
  }
  /**
   * Called if the lower-level ImapClient has encountered an unrecoverable
   * error during operation. Cleans up and propagates the error upwards.
   */


  _createClass(Client, [{
    key: "_onError",
    value: function _onError(err) {
      // make sure no idle timeout is pending anymore
      clearTimeout(this._idleTimeout); // propagate the error upwards

      this.onerror && this.onerror(err);
    } //
    //
    // PUBLIC API
    //
    //

    /**
     * Initiate connection and login to the IMAP server
     *
     * @returns {Promise} Promise when login procedure is complete
     */

  }, {
    key: "connect",
    value: function () {
      var _connect = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return this.openConnection();

              case 3:
                _context.next = 5;
                return this.upgradeConnection();

              case 5:
                _context.prev = 5;
                _context.next = 8;
                return this.updateId(this._clientId);

              case 8:
                _context.next = 13;
                break;

              case 10:
                _context.prev = 10;
                _context.t0 = _context["catch"](5);
                this.logger.warn('Failed to update server id!', _context.t0.message);

              case 13:
                _context.next = 15;
                return this.login(this._auth);

              case 15:
                _context.next = 17;
                return this.compressConnection();

              case 17:
                this.logger.debug('Connection established, ready to roll!');
                this.client.onerror = this._onError.bind(this);
                _context.next = 26;
                break;

              case 21:
                _context.prev = 21;
                _context.t1 = _context["catch"](0);
                this.logger.error('Could not connect to server', _context.t1);
                this.close(_context.t1); // we don't really care whether this works or not

                throw _context.t1;

              case 26:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 21], [5, 10]]);
      }));

      function connect() {
        return _connect.apply(this, arguments);
      }

      return connect;
    }()
    /**
     * Initiate connection to the IMAP server
     *
     * @returns {Promise} capability of server without login
     */

  }, {
    key: "openConnection",
    value: function openConnection() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var connectionTimeout = setTimeout(function () {
          return reject(new Error('Timeout connecting to server'));
        }, _this2.timeoutConnection);

        _this2.logger.debug('Connecting to', _this2.client.host, ':', _this2.client.port);

        _this2._changeState(STATE_CONNECTING);

        _this2.client.connect().then(function () {
          _this2.logger.debug('Socket opened, waiting for greeting from the server...');

          _this2.client.onready = function () {
            clearTimeout(connectionTimeout);

            _this2._changeState(STATE_NOT_AUTHENTICATED);

            _this2.updateCapability().then(function () {
              return resolve(_this2._capability);
            });
          };

          _this2.client.onerror = function (err) {
            clearTimeout(connectionTimeout);
            reject(err);
          };
        })["catch"](reject);
      });
    }
    /**
     * Logout
     *
     * Send LOGOUT, to which the server responds by closing the connection.
     * Use is discouraged if network status is unclear! If networks status is
     * unclear, please use #close instead!
     *
     * LOGOUT details:
     *   https://tools.ietf.org/html/rfc3501#section-6.1.3
     *
     * @returns {Promise} Resolves when server has closed the connection
     */

  }, {
    key: "logout",
    value: function () {
      var _logout = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this._changeState(STATE_LOGOUT);

                this.logger.debug('Logging out...');
                _context2.next = 4;
                return this.client.logout();

              case 4:
                clearTimeout(this._idleTimeout);

              case 5:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function logout() {
        return _logout.apply(this, arguments);
      }

      return logout;
    }()
    /**
     * Force-closes the current connection by closing the TCP socket.
     *
     * @returns {Promise} Resolves when socket is closed
     */

  }, {
    key: "close",
    value: function () {
      var _close = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(err) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this._changeState(STATE_LOGOUT);

                clearTimeout(this._idleTimeout);
                this.logger.debug('Closing connection...');
                _context3.next = 5;
                return this.client.close(err);

              case 5:
                clearTimeout(this._idleTimeout);

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function close(_x) {
        return _close.apply(this, arguments);
      }

      return close;
    }()
    /**
     * Runs ID command, parses ID response, sets this.serverId
     *
     * ID details:
     *   http://tools.ietf.org/html/rfc2971
     *
     * @param {Object} id ID as JSON object. See http://tools.ietf.org/html/rfc2971#section-3.3 for possible values
     * @returns {Promise} Resolves when response has been parsed
     */

  }, {
    key: "updateId",
    value: function () {
      var _updateId = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(id) {
        var command, attributes, response, list, keys, values;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!(this._capability.indexOf('ID') < 0)) {
                  _context4.next = 2;
                  break;
                }

                return _context4.abrupt("return");

              case 2:
                this.logger.debug('Updating id...');
                command = 'ID';
                attributes = id ? [flatten(Object.entries(id))] : [null];
                _context4.next = 7;
                return this.exec({
                  command: command,
                  attributes: attributes
                }, 'ID');

              case 7:
                response = _context4.sent;
                list = flatten(pathOr([], ['payload', 'ID', '0', 'attributes', '0'], response).map(Object.values));
                keys = list.filter(function (_, i) {
                  return i % 2 === 0;
                });
                values = list.filter(function (_, i) {
                  return i % 2 === 1;
                });
                this.serverId = fromPairs(zip(keys, values));
                this.logger.debug('Server id updated!', this.serverId);

              case 13:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function updateId(_x2) {
        return _updateId.apply(this, arguments);
      }

      return updateId;
    }()
  }, {
    key: "_shouldSelectMailbox",
    value: function _shouldSelectMailbox(path, ctx) {
      if (!ctx) {
        return true;
      }

      var previousSelect = this.client.getPreviouslyQueued(['SELECT', 'EXAMINE'], ctx);

      if (previousSelect && previousSelect.request.attributes) {
        var pathAttribute = previousSelect.request.attributes.find(function (attribute) {
          return attribute.type === 'STRING';
        });

        if (pathAttribute) {
          return pathAttribute.value !== path;
        }
      }

      return this._selectedMailbox !== path;
    }
    /**
     * Runs SELECT or EXAMINE to open a mailbox
     *
     * SELECT details:
     *   http://tools.ietf.org/html/rfc3501#section-6.3.1
     * EXAMINE details:
     *   http://tools.ietf.org/html/rfc3501#section-6.3.2
     *
     * @param {String} path Full path to mailbox
     * @param {Object} [options] Options object
     * @returns {Promise} Promise with information about the selected mailbox
     */

  }, {
    key: "selectMailbox",
    value: function () {
      var _selectMailbox = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(path) {
        var options,
            query,
            response,
            mailboxInfo,
            _args5 = arguments;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                options = _args5.length > 1 && _args5[1] !== undefined ? _args5[1] : {};
                query = {
                  command: options.readOnly ? 'EXAMINE' : 'SELECT',
                  attributes: [{
                    type: 'STRING',
                    value: path
                  }]
                };

                if (options.condstore && this._capability.indexOf('CONDSTORE') >= 0) {
                  query.attributes.push([{
                    type: 'ATOM',
                    value: 'CONDSTORE'
                  }]);
                }

                this.logger.debug('Opening', path, '...');
                _context5.next = 6;
                return this.exec(query, ['EXISTS', 'FLAGS', 'OK'], {
                  ctx: options.ctx
                });

              case 6:
                response = _context5.sent;
                mailboxInfo = parseSELECT(response);

                this._changeState(STATE_SELECTED);

                if (!(this._selectedMailbox !== path && this.onclosemailbox)) {
                  _context5.next = 12;
                  break;
                }

                _context5.next = 12;
                return this.onclosemailbox(this._selectedMailbox);

              case 12:
                this._selectedMailbox = path;

                if (!this.onselectmailbox) {
                  _context5.next = 16;
                  break;
                }

                _context5.next = 16;
                return this.onselectmailbox(path, mailboxInfo);

              case 16:
                return _context5.abrupt("return", mailboxInfo);

              case 17:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function selectMailbox(_x3) {
        return _selectMailbox.apply(this, arguments);
      }

      return selectMailbox;
    }()
    /**
     * Runs NAMESPACE command
     *
     * NAMESPACE details:
     *   https://tools.ietf.org/html/rfc2342
     *
     * @returns {Promise} Promise with namespace object
     */

  }, {
    key: "listNamespaces",
    value: function () {
      var _listNamespaces = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
        var response;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(this._capability.indexOf('NAMESPACE') < 0)) {
                  _context6.next = 2;
                  break;
                }

                return _context6.abrupt("return", false);

              case 2:
                this.logger.debug('Listing namespaces...');
                _context6.next = 5;
                return this.exec('NAMESPACE', 'NAMESPACE');

              case 5:
                response = _context6.sent;
                return _context6.abrupt("return", parseNAMESPACE(response));

              case 7:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function listNamespaces() {
        return _listNamespaces.apply(this, arguments);
      }

      return listNamespaces;
    }()
    /**
     * Runs LIST and LSUB commands. Retrieves a tree of available mailboxes
     *
     * LIST details:
     *   http://tools.ietf.org/html/rfc3501#section-6.3.8
     * LSUB details:
     *   http://tools.ietf.org/html/rfc3501#section-6.3.9
     *
     * @returns {Promise} Promise with list of mailboxes
     */

  }, {
    key: "listMailboxes",
    value: function () {
      var _listMailboxes = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
        var _this3 = this;

        var tree, listResponse, list, lsubResponse, lsub;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                tree = {
                  root: true,
                  children: []
                };
                this.logger.debug('Listing mailboxes...');
                _context7.next = 4;
                return this.exec({
                  command: 'LIST',
                  attributes: ['', '*']
                }, 'LIST');

              case 4:
                listResponse = _context7.sent;
                list = pathOr([], ['payload', 'LIST'], listResponse);
                list.forEach(function (item) {
                  var attr = propOr([], 'attributes', item);
                  if (attr.length < 3) return;
                  var path = pathOr('', ['2', 'value'], attr);
                  var delim = pathOr('/', ['1', 'value'], attr);

                  var branch = _this3._ensurePath(tree, path, delim);

                  branch.flags = propOr([], '0', attr).map(function (_ref) {
                    var value = _ref.value;
                    return value || '';
                  });
                  branch.listed = true;
                  checkSpecialUse(branch);
                });
                _context7.next = 9;
                return this.exec({
                  command: 'LSUB',
                  attributes: ['', '*']
                }, 'LSUB');

              case 9:
                lsubResponse = _context7.sent;
                lsub = pathOr([], ['payload', 'LSUB'], lsubResponse);
                lsub.forEach(function (item) {
                  var attr = propOr([], 'attributes', item);
                  if (attr.length < 3) return;
                  var path = pathOr('', ['2', 'value'], attr);
                  var delim = pathOr('/', ['1', 'value'], attr);

                  var branch = _this3._ensurePath(tree, path, delim);

                  propOr([], '0', attr).map(function () {
                    var flag = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
                    branch.flags = union(branch.flags, [flag]);
                  });
                  branch.subscribed = true;
                });
                return _context7.abrupt("return", tree);

              case 13:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function listMailboxes() {
        return _listMailboxes.apply(this, arguments);
      }

      return listMailboxes;
    }()
    /**
     * Runs mailbox STATUS
     *
     * STATUS details:
     *  https://tools.ietf.org/html/rfc3501#section-6.3.10
     *
     * @param {String} path Full path to mailbox
     * @param {Object} [options] Options object
     * @returns {Promise} Promise with information about the selected mailbox
     */

  }, {
    key: "mailboxStatus",
    value: function () {
      var _mailboxStatus = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(path) {
        var options,
            statusDataItems,
            statusAttributes,
            response,
            _args8 = arguments;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                options = _args8.length > 1 && _args8[1] !== undefined ? _args8[1] : {};
                statusDataItems = ['UIDNEXT', 'MESSAGES'];

                if (options.condstore && this._capability.indexOf('CONDSTORE') >= 0) {
                  statusDataItems.push('HIGHESTMODSEQ');
                }

                statusAttributes = statusDataItems.map(function (statusDataItem) {
                  return {
                    type: 'ATOM',
                    value: statusDataItem
                  };
                });
                this.logger.debug('Opening', path, '...');
                _context8.next = 7;
                return this.exec({
                  command: 'STATUS',
                  attributes: [{
                    type: 'STRING',
                    value: path
                  }, _toConsumableArray(statusAttributes)]
                }, ['STATUS']);

              case 7:
                response = _context8.sent;
                return _context8.abrupt("return", parseSTATUS(response, statusDataItems));

              case 9:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function mailboxStatus(_x4) {
        return _mailboxStatus.apply(this, arguments);
      }

      return mailboxStatus;
    }()
    /**
     * Create a mailbox with the given path.
     *
     * CREATE details:
     *   http://tools.ietf.org/html/rfc3501#section-6.3.3
     *
     * @param {String} path
     *     The path of the mailbox you would like to create.  This method will
     *     handle utf7 encoding for you.
     * @returns {Promise}
     *     Promise resolves if mailbox was created.
     *     In the event the server says NO [ALREADYEXISTS], we treat that as success.
     */

  }, {
    key: "createMailbox",
    value: function () {
      var _createMailbox = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(path) {
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                this.logger.debug('Creating mailbox', path, '...');
                _context9.prev = 1;
                _context9.next = 4;
                return this.exec({
                  command: 'CREATE',
                  attributes: [imapEncode(path)]
                });

              case 4:
                _context9.next = 11;
                break;

              case 6:
                _context9.prev = 6;
                _context9.t0 = _context9["catch"](1);

                if (!(_context9.t0 && _context9.t0.code === 'ALREADYEXISTS')) {
                  _context9.next = 10;
                  break;
                }

                return _context9.abrupt("return");

              case 10:
                throw _context9.t0;

              case 11:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this, [[1, 6]]);
      }));

      function createMailbox(_x5) {
        return _createMailbox.apply(this, arguments);
      }

      return createMailbox;
    }()
    /**
     * Delete a mailbox with the given path.
     *
     * DELETE details:
     *   https://tools.ietf.org/html/rfc3501#section-6.3.4
     *
     * @param {String} path
     *     The path of the mailbox you would like to delete.  This method will
     *     handle utf7 encoding for you.
     * @returns {Promise}
     *     Promise resolves if mailbox was deleted.
     */

  }, {
    key: "deleteMailbox",
    value: function deleteMailbox(path) {
      this.logger.debug('Deleting mailbox', path, '...');
      return this.exec({
        command: 'DELETE',
        attributes: [imapEncode(path)]
      });
    }
    /**
     * Runs FETCH command
     *
     * FETCH details:
     *   http://tools.ietf.org/html/rfc3501#section-6.4.5
     * CHANGEDSINCE details:
     *   https://tools.ietf.org/html/rfc4551#section-3.3
     *
     * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
     * @param {String} sequence Sequence set, eg 1:* for all messages
     * @param {Object} [items] Message data item names or macro
     * @param {Object} [options] Query modifiers
     * @returns {Promise} Promise with the fetched message info
     */

  }, {
    key: "listMessages",
    value: function () {
      var _listMessages = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(path, sequence) {
        var _this4 = this;

        var items,
            options,
            command,
            response,
            _args10 = arguments;
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                items = _args10.length > 2 && _args10[2] !== undefined ? _args10[2] : [{
                  fast: true
                }];
                options = _args10.length > 3 && _args10[3] !== undefined ? _args10[3] : {};
                this.logger.debug('Fetching messages', sequence, 'from', path, '...');
                command = buildFETCHCommand(sequence, items, options);
                _context10.next = 6;
                return this.exec(command, 'FETCH', {
                  precheck: function precheck(ctx) {
                    return _this4._shouldSelectMailbox(path, ctx) ? _this4.selectMailbox(path, {
                      ctx: ctx
                    }) : Promise.resolve();
                  }
                });

              case 6:
                response = _context10.sent;
                return _context10.abrupt("return", parseFETCH(response));

              case 8:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function listMessages(_x6, _x7) {
        return _listMessages.apply(this, arguments);
      }

      return listMessages;
    }()
    /**
     * Runs SEARCH command
     *
     * SEARCH details:
     *   http://tools.ietf.org/html/rfc3501#section-6.4.4
     *
     * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
     * @param {Object} query Search terms
     * @param {Object} [options] Query modifiers
     * @returns {Promise} Promise with the array of matching seq. or uid numbers
     */

  }, {
    key: "search",
    value: function () {
      var _search = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(path, query) {
        var _this5 = this;

        var options,
            command,
            response,
            _args11 = arguments;
        return regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                options = _args11.length > 2 && _args11[2] !== undefined ? _args11[2] : {};
                this.logger.debug('Searching in', path, '...');
                command = buildSEARCHCommand(query, options);
                _context11.next = 5;
                return this.exec(command, 'SEARCH', {
                  precheck: function precheck(ctx) {
                    return _this5._shouldSelectMailbox(path, ctx) ? _this5.selectMailbox(path, {
                      ctx: ctx
                    }) : Promise.resolve();
                  }
                });

              case 5:
                response = _context11.sent;
                return _context11.abrupt("return", parseSEARCH(response));

              case 7:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function search(_x8, _x9) {
        return _search.apply(this, arguments);
      }

      return search;
    }()
    /**
     * Runs STORE command
     *
     * STORE details:
     *   http://tools.ietf.org/html/rfc3501#section-6.4.6
     *
     * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
     * @param {String} sequence Message selector which the flag change is applied to
     * @param {Array} flags
     * @param {Object} [options] Query modifiers
     * @returns {Promise} Promise with the array of matching seq. or uid numbers
     */

  }, {
    key: "setFlags",
    value: function setFlags(path, sequence, flags, options) {
      var key = '';
      var list = [];

      if (Array.isArray(flags) || typeof flags !== 'object') {
        list = [].concat(flags || []);
        key = '';
      } else if (flags.add) {
        list = [].concat(flags.add || []);
        key = '+';
      } else if (flags.set) {
        key = '';
        list = [].concat(flags.set || []);
      } else if (flags.remove) {
        key = '-';
        list = [].concat(flags.remove || []);
      }

      this.logger.debug('Setting flags on', sequence, 'in', path, '...');
      return this.store(path, sequence, key + 'FLAGS', list, options);
    }
    /**
     * Runs STORE command
     *
     * STORE details:
     *   http://tools.ietf.org/html/rfc3501#section-6.4.6
     *
     * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
     * @param {String} sequence Message selector which the flag change is applied to
     * @param {String} action STORE method to call, eg "+FLAGS"
     * @param {Array} flags
     * @param {Object} [options] Query modifiers
     * @returns {Promise} Promise with the array of matching seq. or uid numbers
     */

  }, {
    key: "store",
    value: function () {
      var _store = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12(path, sequence, action, flags) {
        var _this6 = this;

        var options,
            command,
            response,
            _args12 = arguments;
        return regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                options = _args12.length > 4 && _args12[4] !== undefined ? _args12[4] : {};
                command = buildSTORECommand(sequence, action, flags, options);
                _context12.next = 4;
                return this.exec(command, 'FETCH', {
                  precheck: function precheck(ctx) {
                    return _this6._shouldSelectMailbox(path, ctx) ? _this6.selectMailbox(path, {
                      ctx: ctx
                    }) : Promise.resolve();
                  }
                });

              case 4:
                response = _context12.sent;
                return _context12.abrupt("return", parseFETCH(response));

              case 6:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function store(_x10, _x11, _x12, _x13) {
        return _store.apply(this, arguments);
      }

      return store;
    }()
    /**
     * Runs APPEND command
     *
     * APPEND details:
     *   http://tools.ietf.org/html/rfc3501#section-6.3.11
     *
     * @param {String} destination The mailbox where to append the message
     * @param {String} message The message to append
     * @param {Array} options.flags Any flags you want to set on the uploaded message. Defaults to [\Seen]. (optional)
     * @returns {Promise} Promise with the array of matching seq. or uid numbers
     */

  }, {
    key: "upload",
    value: function () {
      var _upload = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(destination, message) {
        var options,
            flags,
            command,
            response,
            _args13 = arguments;
        return regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                options = _args13.length > 2 && _args13[2] !== undefined ? _args13[2] : {};
                flags = propOr(['\\Seen'], 'flags', options).map(function (value) {
                  return {
                    type: 'atom',
                    value: value
                  };
                });
                command = {
                  command: 'APPEND',
                  attributes: [{
                    type: 'atom',
                    value: destination
                  }, flags, {
                    type: 'literal',
                    value: message
                  }]
                };
                this.logger.debug('Uploading message to', destination, '...');
                _context13.next = 6;
                return this.exec(command);

              case 6:
                response = _context13.sent;
                return _context13.abrupt("return", parseAPPEND(response));

              case 8:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function upload(_x14, _x15) {
        return _upload.apply(this, arguments);
      }

      return upload;
    }()
    /**
     * Deletes messages from a selected mailbox
     *
     * EXPUNGE details:
     *   http://tools.ietf.org/html/rfc3501#section-6.4.3
     * UID EXPUNGE details:
     *   https://tools.ietf.org/html/rfc4315#section-2.1
     *
     * If possible (byUid:true and UIDPLUS extension supported), uses UID EXPUNGE
     * command to delete a range of messages, otherwise falls back to EXPUNGE.
     *
     * NB! This method might be destructive - if EXPUNGE is used, then any messages
     * with \Deleted flag set are deleted
     *
     * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
     * @param {String} sequence Message range to be deleted
     * @param {Object} [options] Query modifiers
     * @returns {Promise} Promise
     */

  }, {
    key: "deleteMessages",
    value: function () {
      var _deleteMessages = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14(path, sequence) {
        var _this7 = this;

        var options,
            useUidPlus,
            uidExpungeCommand,
            cmd,
            _args14 = arguments;
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                options = _args14.length > 2 && _args14[2] !== undefined ? _args14[2] : {};
                // add \Deleted flag to the messages and run EXPUNGE or UID EXPUNGE
                this.logger.debug('Deleting messages', sequence, 'in', path, '...');
                useUidPlus = options.byUid && this._capability.indexOf('UIDPLUS') >= 0;
                uidExpungeCommand = {
                  command: 'UID EXPUNGE',
                  attributes: [{
                    type: 'sequence',
                    value: sequence
                  }]
                };
                _context14.next = 6;
                return this.setFlags(path, sequence, {
                  add: '\\Deleted'
                }, options);

              case 6:
                cmd = useUidPlus ? uidExpungeCommand : 'EXPUNGE';
                return _context14.abrupt("return", this.exec(cmd, null, {
                  precheck: function precheck(ctx) {
                    return _this7._shouldSelectMailbox(path, ctx) ? _this7.selectMailbox(path, {
                      ctx: ctx
                    }) : Promise.resolve();
                  }
                }));

              case 8:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function deleteMessages(_x16, _x17) {
        return _deleteMessages.apply(this, arguments);
      }

      return deleteMessages;
    }()
    /**
     * Copies a range of messages from the active mailbox to the destination mailbox.
     * Silent method (unless an error occurs), by default returns no information.
     *
     * COPY details:
     *   http://tools.ietf.org/html/rfc3501#section-6.4.7
     *
     * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
     * @param {String} sequence Message range to be copied
     * @param {String} destination Destination mailbox path
     * @param {Object} [options] Query modifiers
     * @param {Boolean} [options.byUid] If true, uses UID COPY instead of COPY
     * @returns {Promise} Promise
     */

  }, {
    key: "copyMessages",
    value: function () {
      var _copyMessages = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15(path, sequence, destination) {
        var _this8 = this;

        var options,
            response,
            _args15 = arguments;
        return regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                options = _args15.length > 3 && _args15[3] !== undefined ? _args15[3] : {};
                this.logger.debug('Copying messages', sequence, 'from', path, 'to', destination, '...');
                _context15.next = 4;
                return this.exec({
                  command: options.byUid ? 'UID COPY' : 'COPY',
                  attributes: [{
                    type: 'sequence',
                    value: sequence
                  }, {
                    type: 'atom',
                    value: destination
                  }]
                }, null, {
                  precheck: function precheck(ctx) {
                    return _this8._shouldSelectMailbox(path, ctx) ? _this8.selectMailbox(path, {
                      ctx: ctx
                    }) : Promise.resolve();
                  }
                });

              case 4:
                response = _context15.sent;
                return _context15.abrupt("return", parseCOPY(response));

              case 6:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function copyMessages(_x18, _x19, _x20) {
        return _copyMessages.apply(this, arguments);
      }

      return copyMessages;
    }()
    /**
     * Moves a range of messages from the active mailbox to the destination mailbox.
     * Prefers the MOVE extension but if not available, falls back to
     * COPY + EXPUNGE
     *
     * MOVE details:
     *   http://tools.ietf.org/html/rfc6851
     *
     * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
     * @param {String} sequence Message range to be moved
     * @param {String} destination Destination mailbox path
     * @param {Object} [options] Query modifiers
     * @returns {Promise} Promise
     */

  }, {
    key: "moveMessages",
    value: function () {
      var _moveMessages = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee16(path, sequence, destination) {
        var _this9 = this;

        var options,
            _args16 = arguments;
        return regeneratorRuntime.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                options = _args16.length > 3 && _args16[3] !== undefined ? _args16[3] : {};
                this.logger.debug('Moving messages', sequence, 'from', path, 'to', destination, '...');

                if (!(this._capability.indexOf('MOVE') === -1)) {
                  _context16.next = 6;
                  break;
                }

                _context16.next = 5;
                return this.copyMessages(path, sequence, destination, options);

              case 5:
                return _context16.abrupt("return", this.deleteMessages(path, sequence, options));

              case 6:
                return _context16.abrupt("return", this.exec({
                  command: options.byUid ? 'UID MOVE' : 'MOVE',
                  attributes: [{
                    type: 'sequence',
                    value: sequence
                  }, {
                    type: 'atom',
                    value: destination
                  }]
                }, ['OK'], {
                  precheck: function precheck(ctx) {
                    return _this9._shouldSelectMailbox(path, ctx) ? _this9.selectMailbox(path, {
                      ctx: ctx
                    }) : Promise.resolve();
                  }
                }));

              case 7:
              case "end":
                return _context16.stop();
            }
          }
        }, _callee16, this);
      }));

      function moveMessages(_x21, _x22, _x23) {
        return _moveMessages.apply(this, arguments);
      }

      return moveMessages;
    }()
    /**
     * Runs COMPRESS command
     *
     * COMPRESS details:
     *   https://tools.ietf.org/html/rfc4978
     */

  }, {
    key: "compressConnection",
    value: function () {
      var _compressConnection = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee17() {
        return regeneratorRuntime.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                if (!(!this._enableCompression || this._capability.indexOf('COMPRESS=DEFLATE') < 0 || this.client.compressed)) {
                  _context17.next = 2;
                  break;
                }

                return _context17.abrupt("return", false);

              case 2:
                this.logger.debug('Enabling compression...');
                _context17.next = 5;
                return this.exec({
                  command: 'COMPRESS',
                  attributes: [{
                    type: 'ATOM',
                    value: 'DEFLATE'
                  }]
                });

              case 5:
                this.client.enableCompression();
                this.logger.debug('Compression enabled, all data sent and received is deflated!');

              case 7:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function compressConnection() {
        return _compressConnection.apply(this, arguments);
      }

      return compressConnection;
    }()
    /**
     * Runs LOGIN or AUTHENTICATE XOAUTH2 command
     *
     * LOGIN details:
     *   http://tools.ietf.org/html/rfc3501#section-6.2.3
     * XOAUTH2 details:
     *   https://developers.google.com/gmail/xoauth2_protocol#imap_protocol_exchange
     *
     * @param {String} auth.user
     * @param {String} auth.pass
     * @param {String} auth.xoauth2
     */

  }, {
    key: "login",
    value: function () {
      var _login = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee18(auth) {
        var command, options, response;
        return regeneratorRuntime.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                options = {};

                if (auth) {
                  _context18.next = 3;
                  break;
                }

                throw new Error('Authentication information not provided');

              case 3:
                if (this._capability.indexOf('AUTH=XOAUTH2') >= 0 && auth && auth.xoauth2) {
                  command = {
                    command: 'AUTHENTICATE',
                    attributes: [{
                      type: 'ATOM',
                      value: 'XOAUTH2'
                    }, {
                      type: 'ATOM',
                      value: buildXOAuth2Token(auth.user, auth.xoauth2),
                      sensitive: true
                    }]
                  };
                  options.errorResponseExpectsEmptyLine = true; // + tagged error response expects an empty line in return
                } else {
                  command = {
                    command: 'login',
                    attributes: [{
                      type: 'STRING',
                      value: auth.user || ''
                    }, {
                      type: 'STRING',
                      value: auth.pass || '',
                      sensitive: true
                    }]
                  };
                }

                this.logger.debug('Logging in...');
                _context18.next = 7;
                return this.exec(command, 'capability', options);

              case 7:
                response = _context18.sent;

                if (!(response.capability && response.capability.length)) {
                  _context18.next = 12;
                  break;
                }

                // capabilites were listed with the OK [CAPABILITY ...] response
                this._capability = response.capability;
                _context18.next = 18;
                break;

              case 12:
                if (!(response.payload && response.payload.CAPABILITY && response.payload.CAPABILITY.length)) {
                  _context18.next = 16;
                  break;
                }

                // capabilites were listed with * CAPABILITY ... response
                this._capability = response.payload.CAPABILITY.pop().attributes.map(function () {
                  var capa = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
                  return capa.value.toUpperCase().trim();
                });
                _context18.next = 18;
                break;

              case 16:
                _context18.next = 18;
                return this.updateCapability(true);

              case 18:
                this._changeState(STATE_AUTHENTICATED);

                this._authenticated = true;
                this.logger.debug('Login successful, post-auth capabilites updated!', this._capability);

              case 21:
              case "end":
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function login(_x24) {
        return _login.apply(this, arguments);
      }

      return login;
    }()
    /**
     * Run an IMAP command.
     *
     * @param {Object} request Structured request object
     * @param {Array} acceptUntagged a list of untagged responses that will be included in 'payload' property
     */

  }, {
    key: "exec",
    value: function () {
      var _exec = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee19(request, acceptUntagged, options) {
        var response;
        return regeneratorRuntime.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                this.breakIdle();
                _context19.next = 3;
                return this.client.enqueueCommand(request, acceptUntagged, options);

              case 3:
                response = _context19.sent;

                if (response && response.capability) {
                  this._capability = response.capability;
                }

                return _context19.abrupt("return", response);

              case 6:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function exec(_x25, _x26, _x27) {
        return _exec.apply(this, arguments);
      }

      return exec;
    }()
    /**
     * The connection is idling. Sends a NOOP or IDLE command
     *
     * IDLE details:
     *   https://tools.ietf.org/html/rfc2177
     */

  }, {
    key: "enterIdle",
    value: function enterIdle() {
      var _this10 = this;

      if (this._enteredIdle) {
        return;
      }

      var supportsIdle = this._capability.indexOf('IDLE') >= 0;
      this._enteredIdle = supportsIdle && this._selectedMailbox ? 'IDLE' : 'NOOP';
      this.logger.debug('Entering idle with ' + this._enteredIdle);

      if (this._enteredIdle === 'NOOP') {
        this._idleTimeout = setTimeout(function () {
          _this10.logger.debug('Sending NOOP');

          _this10.exec('NOOP');
        }, this.timeoutNoop);
      } else if (this._enteredIdle === 'IDLE') {
        this.client.enqueueCommand({
          command: 'IDLE'
        });
        this._idleTimeout = setTimeout(function () {
          _this10.client.send('DONE\r\n');

          _this10._enteredIdle = false;

          _this10.logger.debug('Idle terminated');
        }, this.timeoutIdle);
      }
    }
    /**
     * Stops actions related idling, if IDLE is supported, sends DONE to stop it
     */

  }, {
    key: "breakIdle",
    value: function breakIdle() {
      if (!this._enteredIdle) {
        return;
      }

      clearTimeout(this._idleTimeout);

      if (this._enteredIdle === 'IDLE') {
        this.client.send('DONE\r\n');
        this.logger.debug('Idle terminated');
      }

      this._enteredIdle = false;
    }
    /**
     * Runs STARTTLS command if needed
     *
     * STARTTLS details:
     *   http://tools.ietf.org/html/rfc3501#section-6.2.1
     *
     * @param {Boolean} [forced] By default the command is not run if capability is already listed. Set to true to skip this validation
     */

  }, {
    key: "upgradeConnection",
    value: function () {
      var _upgradeConnection = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee20() {
        return regeneratorRuntime.wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                if (!this.client.secureMode) {
                  _context20.next = 2;
                  break;
                }

                return _context20.abrupt("return", false);

              case 2:
                if (!((this._capability.indexOf('STARTTLS') < 0 || this._ignoreTLS) && !this._requireTLS)) {
                  _context20.next = 4;
                  break;
                }

                return _context20.abrupt("return", false);

              case 4:
                this.logger.debug('Encrypting connection...');
                _context20.next = 7;
                return this.exec('STARTTLS');

              case 7:
                this._capability = [];
                this.client.upgrade();
                return _context20.abrupt("return", this.updateCapability());

              case 10:
              case "end":
                return _context20.stop();
            }
          }
        }, _callee20, this);
      }));

      function upgradeConnection() {
        return _upgradeConnection.apply(this, arguments);
      }

      return upgradeConnection;
    }()
    /**
     * Runs CAPABILITY command
     *
     * CAPABILITY details:
     *   http://tools.ietf.org/html/rfc3501#section-6.1.1
     *
     * Doesn't register untagged CAPABILITY handler as this is already
     * handled by global handler
     *
     * @param {Boolean} [forced] By default the command is not run if capability is already listed. Set to true to skip this validation
     */

  }, {
    key: "updateCapability",
    value: function () {
      var _updateCapability = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee21(forced) {
        return regeneratorRuntime.wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                if (!(!forced && this._capability.length)) {
                  _context21.next = 2;
                  break;
                }

                return _context21.abrupt("return");

              case 2:
                if (!(!this.client.secureMode && this._requireTLS)) {
                  _context21.next = 4;
                  break;
                }

                return _context21.abrupt("return");

              case 4:
                this.logger.debug('Updating capability...');
                return _context21.abrupt("return", this.exec('CAPABILITY'));

              case 6:
              case "end":
                return _context21.stop();
            }
          }
        }, _callee21, this);
      }));

      function updateCapability(_x28) {
        return _updateCapability.apply(this, arguments);
      }

      return updateCapability;
    }()
  }, {
    key: "hasCapability",
    value: function hasCapability() {
      var capa = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      return this._capability.indexOf(capa.toUpperCase().trim()) >= 0;
    } // Default handlers for untagged responses

    /**
     * Checks if an untagged OK includes [CAPABILITY] tag and updates capability object
     *
     * @param {Object} response Parsed server response
     * @param {Function} next Until called, server responses are not processed
     */

  }, {
    key: "_untaggedOkHandler",
    value: function _untaggedOkHandler(response) {
      if (response && response.capability) {
        this._capability = response.capability;
      }
    }
    /**
     * Updates capability object
     *
     * @param {Object} response Parsed server response
     * @param {Function} next Until called, server responses are not processed
     */

  }, {
    key: "_untaggedCapabilityHandler",
    value: function _untaggedCapabilityHandler(response) {
      this._capability = pipe(propOr([], 'attributes'), map(function (_ref2) {
        var value = _ref2.value;
        return (value || '').toUpperCase().trim();
      }))(response);
    }
    /**
     * Updates existing message count
     *
     * @param {Object} response Parsed server response
     * @param {Function} next Until called, server responses are not processed
     */

  }, {
    key: "_untaggedExistsHandler",
    value: function _untaggedExistsHandler(response) {
      if (response && Object.prototype.hasOwnProperty.call(response, 'nr')) {
        this.onupdate && this.onupdate(this._selectedMailbox, 'exists', response.nr);
      }
    }
    /**
     * Indicates a message has been deleted
     *
     * @param {Object} response Parsed server response
     * @param {Function} next Until called, server responses are not processed
     */

  }, {
    key: "_untaggedExpungeHandler",
    value: function _untaggedExpungeHandler(response) {
      if (response && Object.prototype.hasOwnProperty.call(response, 'nr')) {
        this.onupdate && this.onupdate(this._selectedMailbox, 'expunge', response.nr);
      }
    }
    /**
     * Indicates that flags have been updated for a message
     *
     * @param {Object} response Parsed server response
     * @param {Function} next Until called, server responses are not processed
     */

  }, {
    key: "_untaggedFetchHandler",
    value: function _untaggedFetchHandler(response) {
      this.onupdate && this.onupdate(this._selectedMailbox, 'fetch', [].concat(parseFETCH({
        payload: {
          FETCH: [response]
        }
      }) || []).shift());
    } // Private helpers

    /**
     * Indicates that the connection started idling. Initiates a cycle
     * of NOOPs or IDLEs to receive notifications about updates in the server
     */

  }, {
    key: "_onIdle",
    value: function _onIdle() {
      if (!this._authenticated || this._enteredIdle) {
        // No need to IDLE when not logged in or already idling
        return;
      }

      this.logger.debug('Client started idling');
      this.enterIdle();
    }
    /**
     * Updates the IMAP state value for the current connection
     *
     * @param {Number} newState The state you want to change to
     */

  }, {
    key: "_changeState",
    value: function _changeState(newState) {
      if (newState === this._state) {
        return;
      }

      this.logger.debug('Entering state: ' + newState); // if a mailbox was opened, emit onclosemailbox and clear selectedMailbox value

      if (this._state === STATE_SELECTED && this._selectedMailbox) {
        this.onclosemailbox && this.onclosemailbox(this._selectedMailbox);
        this._selectedMailbox = false;
      }

      this._state = newState;
    }
    /**
     * Ensures a path exists in the Mailbox tree
     *
     * @param {Object} tree Mailbox tree
     * @param {String} path
     * @param {String} delimiter
     * @return {Object} branch for used path
     */

  }, {
    key: "_ensurePath",
    value: function _ensurePath(tree, path, delimiter) {
      var names = path.split(delimiter);
      var branch = tree;

      for (var i = 0; i < names.length; i++) {
        var found = false;

        for (var j = 0; j < branch.children.length; j++) {
          if (this._compareMailboxNames(branch.children[j].name, imapDecode(names[i]))) {
            branch = branch.children[j];
            found = true;
            break;
          }
        }

        if (!found) {
          branch.children.push({
            name: imapDecode(names[i]),
            delimiter: delimiter,
            path: names.slice(0, i + 1).join(delimiter),
            children: []
          });
          branch = branch.children[branch.children.length - 1];
        }
      }

      return branch;
    }
    /**
     * Compares two mailbox names. Case insensitive in case of INBOX, otherwise case sensitive
     *
     * @param {String} a Mailbox name
     * @param {String} b Mailbox name
     * @returns {Boolean} True if the folder names match
     */

  }, {
    key: "_compareMailboxNames",
    value: function _compareMailboxNames(a, b) {
      return (a.toUpperCase() === 'INBOX' ? 'INBOX' : a) === (b.toUpperCase() === 'INBOX' ? 'INBOX' : b);
    }
  }, {
    key: "createLogger",
    value: function createLogger() {
      var _this11 = this;

      var creator = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : createDefaultLogger;
      var logger = creator((this._auth || {}).user || '', this._host);
      this.logger = this.client.logger = {
        debug: function debug() {
          if (LOG_LEVEL_DEBUG >= _this11.logLevel) {
            for (var _len = arguments.length, msgs = new Array(_len), _key = 0; _key < _len; _key++) {
              msgs[_key] = arguments[_key];
            }

            logger.debug(msgs);
          }
        },
        info: function info() {
          if (LOG_LEVEL_INFO >= _this11.logLevel) {
            for (var _len2 = arguments.length, msgs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
              msgs[_key2] = arguments[_key2];
            }

            logger.info(msgs);
          }
        },
        warn: function warn() {
          if (LOG_LEVEL_WARN >= _this11.logLevel) {
            for (var _len3 = arguments.length, msgs = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
              msgs[_key3] = arguments[_key3];
            }

            logger.warn(msgs);
          }
        },
        error: function error() {
          if (LOG_LEVEL_ERROR >= _this11.logLevel) {
            for (var _len4 = arguments.length, msgs = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
              msgs[_key4] = arguments[_key4];
            }

            logger.error(msgs);
          }
        }
      };
    }
  }]);

  return Client;
}();

export { Client as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGllbnQuanMiXSwibmFtZXMiOlsibWFwIiwicGlwZSIsInVuaW9uIiwiemlwIiwiZnJvbVBhaXJzIiwicHJvcE9yIiwicGF0aE9yIiwiZmxhdHRlbiIsImltYXBFbmNvZGUiLCJpbWFwRGVjb2RlIiwicGFyc2VBUFBFTkQiLCJwYXJzZUNPUFkiLCJwYXJzZU5BTUVTUEFDRSIsInBhcnNlU0VMRUNUIiwicGFyc2VGRVRDSCIsInBhcnNlU0VBUkNIIiwicGFyc2VTVEFUVVMiLCJidWlsZEZFVENIQ29tbWFuZCIsImJ1aWxkWE9BdXRoMlRva2VuIiwiYnVpbGRTRUFSQ0hDb21tYW5kIiwiYnVpbGRTVE9SRUNvbW1hbmQiLCJjcmVhdGVEZWZhdWx0TG9nZ2VyIiwiSW1hcENsaWVudCIsIkxPR19MRVZFTF9FUlJPUiIsIkxPR19MRVZFTF9XQVJOIiwiTE9HX0xFVkVMX0lORk8iLCJMT0dfTEVWRUxfREVCVUciLCJMT0dfTEVWRUxfQUxMIiwiY2hlY2tTcGVjaWFsVXNlIiwiVElNRU9VVF9DT05ORUNUSU9OIiwiVElNRU9VVF9OT09QIiwiVElNRU9VVF9JRExFIiwiU1RBVEVfQ09OTkVDVElORyIsIlNUQVRFX05PVF9BVVRIRU5USUNBVEVEIiwiU1RBVEVfQVVUSEVOVElDQVRFRCIsIlNUQVRFX1NFTEVDVEVEIiwiU1RBVEVfTE9HT1VUIiwiREVGQVVMVF9DTElFTlRfSUQiLCJuYW1lIiwiQ2xpZW50IiwiaG9zdCIsInBvcnQiLCJvcHRpb25zIiwidGltZW91dENvbm5lY3Rpb24iLCJ0aW1lb3V0Tm9vcCIsInRpbWVvdXRJZGxlIiwic2VydmVySWQiLCJvbmNlcnQiLCJvbnVwZGF0ZSIsIm9uc2VsZWN0bWFpbGJveCIsIm9uY2xvc2VtYWlsYm94IiwiX2hvc3QiLCJfY2xpZW50SWQiLCJfc3RhdGUiLCJfYXV0aGVudGljYXRlZCIsIl9jYXBhYmlsaXR5IiwiX3NlbGVjdGVkTWFpbGJveCIsIl9lbnRlcmVkSWRsZSIsIl9pZGxlVGltZW91dCIsIl9lbmFibGVDb21wcmVzc2lvbiIsImVuYWJsZUNvbXByZXNzaW9uIiwiX2F1dGgiLCJhdXRoIiwiX3JlcXVpcmVUTFMiLCJyZXF1aXJlVExTIiwiX2lnbm9yZVRMUyIsImlnbm9yZVRMUyIsImNsaWVudCIsIm9uZXJyb3IiLCJfb25FcnJvciIsImJpbmQiLCJjZXJ0Iiwib25pZGxlIiwiX29uSWRsZSIsInNldEhhbmRsZXIiLCJyZXNwb25zZSIsIl91bnRhZ2dlZENhcGFiaWxpdHlIYW5kbGVyIiwiX3VudGFnZ2VkT2tIYW5kbGVyIiwiX3VudGFnZ2VkRXhpc3RzSGFuZGxlciIsIl91bnRhZ2dlZEV4cHVuZ2VIYW5kbGVyIiwiX3VudGFnZ2VkRmV0Y2hIYW5kbGVyIiwiY3JlYXRlTG9nZ2VyIiwibG9nTGV2ZWwiLCJlcnIiLCJjbGVhclRpbWVvdXQiLCJvcGVuQ29ubmVjdGlvbiIsInVwZ3JhZGVDb25uZWN0aW9uIiwidXBkYXRlSWQiLCJsb2dnZXIiLCJ3YXJuIiwibWVzc2FnZSIsImxvZ2luIiwiY29tcHJlc3NDb25uZWN0aW9uIiwiZGVidWciLCJlcnJvciIsImNsb3NlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJjb25uZWN0aW9uVGltZW91dCIsInNldFRpbWVvdXQiLCJFcnJvciIsIl9jaGFuZ2VTdGF0ZSIsImNvbm5lY3QiLCJ0aGVuIiwib25yZWFkeSIsInVwZGF0ZUNhcGFiaWxpdHkiLCJsb2dvdXQiLCJpZCIsImluZGV4T2YiLCJjb21tYW5kIiwiYXR0cmlidXRlcyIsIk9iamVjdCIsImVudHJpZXMiLCJleGVjIiwibGlzdCIsInZhbHVlcyIsImtleXMiLCJmaWx0ZXIiLCJfIiwiaSIsInBhdGgiLCJjdHgiLCJwcmV2aW91c1NlbGVjdCIsImdldFByZXZpb3VzbHlRdWV1ZWQiLCJyZXF1ZXN0IiwicGF0aEF0dHJpYnV0ZSIsImZpbmQiLCJhdHRyaWJ1dGUiLCJ0eXBlIiwidmFsdWUiLCJxdWVyeSIsInJlYWRPbmx5IiwiY29uZHN0b3JlIiwicHVzaCIsIm1haWxib3hJbmZvIiwidHJlZSIsInJvb3QiLCJjaGlsZHJlbiIsImxpc3RSZXNwb25zZSIsImZvckVhY2giLCJpdGVtIiwiYXR0ciIsImxlbmd0aCIsImRlbGltIiwiYnJhbmNoIiwiX2Vuc3VyZVBhdGgiLCJmbGFncyIsImxpc3RlZCIsImxzdWJSZXNwb25zZSIsImxzdWIiLCJmbGFnIiwic3Vic2NyaWJlZCIsInN0YXR1c0RhdGFJdGVtcyIsInN0YXR1c0F0dHJpYnV0ZXMiLCJzdGF0dXNEYXRhSXRlbSIsImNvZGUiLCJzZXF1ZW5jZSIsIml0ZW1zIiwiZmFzdCIsInByZWNoZWNrIiwiX3Nob3VsZFNlbGVjdE1haWxib3giLCJzZWxlY3RNYWlsYm94Iiwia2V5IiwiQXJyYXkiLCJpc0FycmF5IiwiY29uY2F0IiwiYWRkIiwic2V0IiwicmVtb3ZlIiwic3RvcmUiLCJhY3Rpb24iLCJkZXN0aW5hdGlvbiIsInVzZVVpZFBsdXMiLCJieVVpZCIsInVpZEV4cHVuZ2VDb21tYW5kIiwic2V0RmxhZ3MiLCJjbWQiLCJjb3B5TWVzc2FnZXMiLCJkZWxldGVNZXNzYWdlcyIsImNvbXByZXNzZWQiLCJ4b2F1dGgyIiwidXNlciIsInNlbnNpdGl2ZSIsImVycm9yUmVzcG9uc2VFeHBlY3RzRW1wdHlMaW5lIiwicGFzcyIsImNhcGFiaWxpdHkiLCJwYXlsb2FkIiwiQ0FQQUJJTElUWSIsInBvcCIsImNhcGEiLCJ0b1VwcGVyQ2FzZSIsInRyaW0iLCJhY2NlcHRVbnRhZ2dlZCIsImJyZWFrSWRsZSIsImVucXVldWVDb21tYW5kIiwic3VwcG9ydHNJZGxlIiwic2VuZCIsInNlY3VyZU1vZGUiLCJ1cGdyYWRlIiwiZm9yY2VkIiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwibnIiLCJGRVRDSCIsInNoaWZ0IiwiZW50ZXJJZGxlIiwibmV3U3RhdGUiLCJkZWxpbWl0ZXIiLCJuYW1lcyIsInNwbGl0IiwiZm91bmQiLCJqIiwiX2NvbXBhcmVNYWlsYm94TmFtZXMiLCJzbGljZSIsImpvaW4iLCJhIiwiYiIsImNyZWF0b3Ii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dGVudCI6WyJpbXBvcnQgeyBtYXAsIHBpcGUsIHVuaW9uLCB6aXAsIGZyb21QYWlycywgcHJvcE9yLCBwYXRoT3IsIGZsYXR0ZW4gfSBmcm9tICdyYW1kYSdcbmltcG9ydCB7IGltYXBFbmNvZGUsIGltYXBEZWNvZGUgfSBmcm9tICdlbWFpbGpzLXV0ZjcnXG5pbXBvcnQge1xuICBwYXJzZUFQUEVORCxcbiAgcGFyc2VDT1BZLFxuICBwYXJzZU5BTUVTUEFDRSxcbiAgcGFyc2VTRUxFQ1QsXG4gIHBhcnNlRkVUQ0gsXG4gIHBhcnNlU0VBUkNILFxuICBwYXJzZVNUQVRVU1xufSBmcm9tICcuL2NvbW1hbmQtcGFyc2VyJ1xuaW1wb3J0IHtcbiAgYnVpbGRGRVRDSENvbW1hbmQsXG4gIGJ1aWxkWE9BdXRoMlRva2VuLFxuICBidWlsZFNFQVJDSENvbW1hbmQsXG4gIGJ1aWxkU1RPUkVDb21tYW5kXG59IGZyb20gJy4vY29tbWFuZC1idWlsZGVyJ1xuXG5pbXBvcnQgY3JlYXRlRGVmYXVsdExvZ2dlciBmcm9tICcuL2xvZ2dlcidcbmltcG9ydCBJbWFwQ2xpZW50IGZyb20gJy4vaW1hcCdcbmltcG9ydCB7XG4gIExPR19MRVZFTF9FUlJPUixcbiAgTE9HX0xFVkVMX1dBUk4sXG4gIExPR19MRVZFTF9JTkZPLFxuICBMT0dfTEVWRUxfREVCVUcsXG4gIExPR19MRVZFTF9BTExcbn0gZnJvbSAnLi9jb21tb24nXG5cbmltcG9ydCB7XG4gIGNoZWNrU3BlY2lhbFVzZVxufSBmcm9tICcuL3NwZWNpYWwtdXNlJ1xuXG5leHBvcnQgY29uc3QgVElNRU9VVF9DT05ORUNUSU9OID0gOTAgKiAxMDAwIC8vIE1pbGxpc2Vjb25kcyB0byB3YWl0IGZvciB0aGUgSU1BUCBncmVldGluZyBmcm9tIHRoZSBzZXJ2ZXJcbmV4cG9ydCBjb25zdCBUSU1FT1VUX05PT1AgPSA2MCAqIDEwMDAgLy8gTWlsbGlzZWNvbmRzIGJldHdlZW4gTk9PUCBjb21tYW5kcyB3aGlsZSBpZGxpbmdcbmV4cG9ydCBjb25zdCBUSU1FT1VUX0lETEUgPSA2MCAqIDEwMDAgLy8gTWlsbGlzZWNvbmRzIHVudGlsIElETEUgY29tbWFuZCBpcyBjYW5jZWxsZWRcblxuZXhwb3J0IGNvbnN0IFNUQVRFX0NPTk5FQ1RJTkcgPSAxXG5leHBvcnQgY29uc3QgU1RBVEVfTk9UX0FVVEhFTlRJQ0FURUQgPSAyXG5leHBvcnQgY29uc3QgU1RBVEVfQVVUSEVOVElDQVRFRCA9IDNcbmV4cG9ydCBjb25zdCBTVEFURV9TRUxFQ1RFRCA9IDRcbmV4cG9ydCBjb25zdCBTVEFURV9MT0dPVVQgPSA1XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0NMSUVOVF9JRCA9IHtcbiAgbmFtZTogJ2VtYWlsanMtaW1hcC1jbGllbnQnXG59XG5cbi8qKlxuICogZW1haWxqcyBJTUFQIGNsaWVudFxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBbaG9zdD0nbG9jYWxob3N0J10gSG9zdG5hbWUgdG8gY29uZW5jdCB0b1xuICogQHBhcmFtIHtOdW1iZXJ9IFtwb3J0PTE0M10gUG9ydCBudW1iZXIgdG8gY29ubmVjdCB0b1xuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25hbCBvcHRpb25zIG9iamVjdFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDbGllbnQge1xuICBjb25zdHJ1Y3RvciAoaG9zdCwgcG9ydCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy50aW1lb3V0Q29ubmVjdGlvbiA9IFRJTUVPVVRfQ09OTkVDVElPTlxuICAgIHRoaXMudGltZW91dE5vb3AgPSBUSU1FT1VUX05PT1BcbiAgICB0aGlzLnRpbWVvdXRJZGxlID0gVElNRU9VVF9JRExFXG5cbiAgICB0aGlzLnNlcnZlcklkID0gZmFsc2UgLy8gUkZDIDI5NzEgU2VydmVyIElEIGFzIGtleSB2YWx1ZSBwYWlyc1xuXG4gICAgLy8gRXZlbnQgcGxhY2Vob2xkZXJzXG4gICAgdGhpcy5vbmNlcnQgPSBudWxsXG4gICAgdGhpcy5vbnVwZGF0ZSA9IG51bGxcbiAgICB0aGlzLm9uc2VsZWN0bWFpbGJveCA9IG51bGxcbiAgICB0aGlzLm9uY2xvc2VtYWlsYm94ID0gbnVsbFxuXG4gICAgdGhpcy5faG9zdCA9IGhvc3RcbiAgICB0aGlzLl9jbGllbnRJZCA9IHByb3BPcihERUZBVUxUX0NMSUVOVF9JRCwgJ2lkJywgb3B0aW9ucylcbiAgICB0aGlzLl9zdGF0ZSA9IGZhbHNlIC8vIEN1cnJlbnQgc3RhdGVcbiAgICB0aGlzLl9hdXRoZW50aWNhdGVkID0gZmFsc2UgLy8gSXMgdGhlIGNvbm5lY3Rpb24gYXV0aGVudGljYXRlZFxuICAgIHRoaXMuX2NhcGFiaWxpdHkgPSBbXSAvLyBMaXN0IG9mIGV4dGVuc2lvbnMgdGhlIHNlcnZlciBzdXBwb3J0c1xuICAgIHRoaXMuX3NlbGVjdGVkTWFpbGJveCA9IGZhbHNlIC8vIFNlbGVjdGVkIG1haWxib3hcbiAgICB0aGlzLl9lbnRlcmVkSWRsZSA9IGZhbHNlXG4gICAgdGhpcy5faWRsZVRpbWVvdXQgPSBmYWxzZVxuICAgIHRoaXMuX2VuYWJsZUNvbXByZXNzaW9uID0gISFvcHRpb25zLmVuYWJsZUNvbXByZXNzaW9uXG4gICAgdGhpcy5fYXV0aCA9IG9wdGlvbnMuYXV0aFxuICAgIHRoaXMuX3JlcXVpcmVUTFMgPSAhIW9wdGlvbnMucmVxdWlyZVRMU1xuICAgIHRoaXMuX2lnbm9yZVRMUyA9ICEhb3B0aW9ucy5pZ25vcmVUTFNcblxuICAgIHRoaXMuY2xpZW50ID0gbmV3IEltYXBDbGllbnQoaG9zdCwgcG9ydCwgb3B0aW9ucykgLy8gSU1BUCBjbGllbnQgb2JqZWN0XG5cbiAgICAvLyBFdmVudCBIYW5kbGVyc1xuICAgIHRoaXMuY2xpZW50Lm9uZXJyb3IgPSB0aGlzLl9vbkVycm9yLmJpbmQodGhpcylcbiAgICB0aGlzLmNsaWVudC5vbmNlcnQgPSAoY2VydCkgPT4gKHRoaXMub25jZXJ0ICYmIHRoaXMub25jZXJ0KGNlcnQpKSAvLyBhbGxvd3MgY2VydGlmaWNhdGUgaGFuZGxpbmcgZm9yIHBsYXRmb3JtcyB3L28gbmF0aXZlIHRscyBzdXBwb3J0XG4gICAgdGhpcy5jbGllbnQub25pZGxlID0gKCkgPT4gdGhpcy5fb25JZGxlKCkgLy8gc3RhcnQgaWRsaW5nXG5cbiAgICAvLyBEZWZhdWx0IGhhbmRsZXJzIGZvciB1bnRhZ2dlZCByZXNwb25zZXNcbiAgICB0aGlzLmNsaWVudC5zZXRIYW5kbGVyKCdjYXBhYmlsaXR5JywgKHJlc3BvbnNlKSA9PiB0aGlzLl91bnRhZ2dlZENhcGFiaWxpdHlIYW5kbGVyKHJlc3BvbnNlKSkgLy8gY2FwYWJpbGl0eSB1cGRhdGVzXG4gICAgdGhpcy5jbGllbnQuc2V0SGFuZGxlcignb2snLCAocmVzcG9uc2UpID0+IHRoaXMuX3VudGFnZ2VkT2tIYW5kbGVyKHJlc3BvbnNlKSkgLy8gbm90aWZpY2F0aW9uc1xuICAgIHRoaXMuY2xpZW50LnNldEhhbmRsZXIoJ2V4aXN0cycsIChyZXNwb25zZSkgPT4gdGhpcy5fdW50YWdnZWRFeGlzdHNIYW5kbGVyKHJlc3BvbnNlKSkgLy8gbWVzc2FnZSBjb3VudCBoYXMgY2hhbmdlZFxuICAgIHRoaXMuY2xpZW50LnNldEhhbmRsZXIoJ2V4cHVuZ2UnLCAocmVzcG9uc2UpID0+IHRoaXMuX3VudGFnZ2VkRXhwdW5nZUhhbmRsZXIocmVzcG9uc2UpKSAvLyBtZXNzYWdlIGhhcyBiZWVuIGRlbGV0ZWRcbiAgICB0aGlzLmNsaWVudC5zZXRIYW5kbGVyKCdmZXRjaCcsIChyZXNwb25zZSkgPT4gdGhpcy5fdW50YWdnZWRGZXRjaEhhbmRsZXIocmVzcG9uc2UpKSAvLyBtZXNzYWdlIGhhcyBiZWVuIHVwZGF0ZWQgKGVnLiBmbGFnIGNoYW5nZSlcblxuICAgIC8vIEFjdGl2YXRlIGxvZ2dpbmdcbiAgICB0aGlzLmNyZWF0ZUxvZ2dlcigpXG4gICAgdGhpcy5sb2dMZXZlbCA9IHByb3BPcihMT0dfTEVWRUxfQUxMLCAnbG9nTGV2ZWwnLCBvcHRpb25zKVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBpZiB0aGUgbG93ZXItbGV2ZWwgSW1hcENsaWVudCBoYXMgZW5jb3VudGVyZWQgYW4gdW5yZWNvdmVyYWJsZVxuICAgKiBlcnJvciBkdXJpbmcgb3BlcmF0aW9uLiBDbGVhbnMgdXAgYW5kIHByb3BhZ2F0ZXMgdGhlIGVycm9yIHVwd2FyZHMuXG4gICAqL1xuICBfb25FcnJvciAoZXJyKSB7XG4gICAgLy8gbWFrZSBzdXJlIG5vIGlkbGUgdGltZW91dCBpcyBwZW5kaW5nIGFueW1vcmVcbiAgICBjbGVhclRpbWVvdXQodGhpcy5faWRsZVRpbWVvdXQpXG5cbiAgICAvLyBwcm9wYWdhdGUgdGhlIGVycm9yIHVwd2FyZHNcbiAgICB0aGlzLm9uZXJyb3IgJiYgdGhpcy5vbmVycm9yKGVycilcbiAgfVxuXG4gIC8vXG4gIC8vXG4gIC8vIFBVQkxJQyBBUElcbiAgLy9cbiAgLy9cblxuICAvKipcbiAgICogSW5pdGlhdGUgY29ubmVjdGlvbiBhbmQgbG9naW4gdG8gdGhlIElNQVAgc2VydmVyXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoZW4gbG9naW4gcHJvY2VkdXJlIGlzIGNvbXBsZXRlXG4gICAqL1xuICBhc3luYyBjb25uZWN0ICgpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5vcGVuQ29ubmVjdGlvbigpXG4gICAgICBhd2FpdCB0aGlzLnVwZ3JhZGVDb25uZWN0aW9uKClcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlSWQodGhpcy5fY2xpZW50SWQpXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybignRmFpbGVkIHRvIHVwZGF0ZSBzZXJ2ZXIgaWQhJywgZXJyLm1lc3NhZ2UpXG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMubG9naW4odGhpcy5fYXV0aClcbiAgICAgIGF3YWl0IHRoaXMuY29tcHJlc3NDb25uZWN0aW9uKClcbiAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdDb25uZWN0aW9uIGVzdGFibGlzaGVkLCByZWFkeSB0byByb2xsIScpXG4gICAgICB0aGlzLmNsaWVudC5vbmVycm9yID0gdGhpcy5fb25FcnJvci5iaW5kKHRoaXMpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcignQ291bGQgbm90IGNvbm5lY3QgdG8gc2VydmVyJywgZXJyKVxuICAgICAgdGhpcy5jbG9zZShlcnIpIC8vIHdlIGRvbid0IHJlYWxseSBjYXJlIHdoZXRoZXIgdGhpcyB3b3JrcyBvciBub3RcbiAgICAgIHRocm93IGVyclxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBjb25uZWN0aW9uIHRvIHRoZSBJTUFQIHNlcnZlclxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gY2FwYWJpbGl0eSBvZiBzZXJ2ZXIgd2l0aG91dCBsb2dpblxuICAgKi9cbiAgb3BlbkNvbm5lY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBjb25uZWN0aW9uVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcignVGltZW91dCBjb25uZWN0aW5nIHRvIHNlcnZlcicpKSwgdGhpcy50aW1lb3V0Q29ubmVjdGlvbilcbiAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdDb25uZWN0aW5nIHRvJywgdGhpcy5jbGllbnQuaG9zdCwgJzonLCB0aGlzLmNsaWVudC5wb3J0KVxuICAgICAgdGhpcy5fY2hhbmdlU3RhdGUoU1RBVEVfQ09OTkVDVElORylcbiAgICAgIHRoaXMuY2xpZW50LmNvbm5lY3QoKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ1NvY2tldCBvcGVuZWQsIHdhaXRpbmcgZm9yIGdyZWV0aW5nIGZyb20gdGhlIHNlcnZlci4uLicpXG5cbiAgICAgICAgdGhpcy5jbGllbnQub25yZWFkeSA9ICgpID0+IHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoY29ubmVjdGlvblRpbWVvdXQpXG4gICAgICAgICAgdGhpcy5fY2hhbmdlU3RhdGUoU1RBVEVfTk9UX0FVVEhFTlRJQ0FURUQpXG4gICAgICAgICAgdGhpcy51cGRhdGVDYXBhYmlsaXR5KClcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHJlc29sdmUodGhpcy5fY2FwYWJpbGl0eSkpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNsaWVudC5vbmVycm9yID0gKGVycikgPT4ge1xuICAgICAgICAgIGNsZWFyVGltZW91dChjb25uZWN0aW9uVGltZW91dClcbiAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9XG4gICAgICB9KS5jYXRjaChyZWplY3QpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2dvdXRcbiAgICpcbiAgICogU2VuZCBMT0dPVVQsIHRvIHdoaWNoIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgYnkgY2xvc2luZyB0aGUgY29ubmVjdGlvbi5cbiAgICogVXNlIGlzIGRpc2NvdXJhZ2VkIGlmIG5ldHdvcmsgc3RhdHVzIGlzIHVuY2xlYXIhIElmIG5ldHdvcmtzIHN0YXR1cyBpc1xuICAgKiB1bmNsZWFyLCBwbGVhc2UgdXNlICNjbG9zZSBpbnN0ZWFkIVxuICAgKlxuICAgKiBMT0dPVVQgZGV0YWlsczpcbiAgICogICBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMS4zXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIHNlcnZlciBoYXMgY2xvc2VkIHRoZSBjb25uZWN0aW9uXG4gICAqL1xuICBhc3luYyBsb2dvdXQgKCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKFNUQVRFX0xPR09VVClcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnTG9nZ2luZyBvdXQuLi4nKVxuICAgIGF3YWl0IHRoaXMuY2xpZW50LmxvZ291dCgpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2lkbGVUaW1lb3V0KVxuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlLWNsb3NlcyB0aGUgY3VycmVudCBjb25uZWN0aW9uIGJ5IGNsb3NpbmcgdGhlIFRDUCBzb2NrZXQuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIHNvY2tldCBpcyBjbG9zZWRcbiAgICovXG4gIGFzeW5jIGNsb3NlIChlcnIpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZShTVEFURV9MT0dPVVQpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2lkbGVUaW1lb3V0KVxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdDbG9zaW5nIGNvbm5lY3Rpb24uLi4nKVxuICAgIGF3YWl0IHRoaXMuY2xpZW50LmNsb3NlKGVycilcbiAgICBjbGVhclRpbWVvdXQodGhpcy5faWRsZVRpbWVvdXQpXG4gIH1cblxuICAvKipcbiAgICogUnVucyBJRCBjb21tYW5kLCBwYXJzZXMgSUQgcmVzcG9uc2UsIHNldHMgdGhpcy5zZXJ2ZXJJZFxuICAgKlxuICAgKiBJRCBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzI5NzFcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGlkIElEIGFzIEpTT04gb2JqZWN0LiBTZWUgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMjk3MSNzZWN0aW9uLTMuMyBmb3IgcG9zc2libGUgdmFsdWVzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIHJlc3BvbnNlIGhhcyBiZWVuIHBhcnNlZFxuICAgKi9cbiAgYXN5bmMgdXBkYXRlSWQgKGlkKSB7XG4gICAgaWYgKHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZignSUQnKSA8IDApIHJldHVyblxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ1VwZGF0aW5nIGlkLi4uJylcblxuICAgIGNvbnN0IGNvbW1hbmQgPSAnSUQnXG4gICAgY29uc3QgYXR0cmlidXRlcyA9IGlkID8gW2ZsYXR0ZW4oT2JqZWN0LmVudHJpZXMoaWQpKV0gOiBbbnVsbF1cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyh7IGNvbW1hbmQsIGF0dHJpYnV0ZXMgfSwgJ0lEJylcbiAgICBjb25zdCBsaXN0ID0gZmxhdHRlbihwYXRoT3IoW10sIFsncGF5bG9hZCcsICdJRCcsICcwJywgJ2F0dHJpYnV0ZXMnLCAnMCddLCByZXNwb25zZSkubWFwKE9iamVjdC52YWx1ZXMpKVxuICAgIGNvbnN0IGtleXMgPSBsaXN0LmZpbHRlcigoXywgaSkgPT4gaSAlIDIgPT09IDApXG4gICAgY29uc3QgdmFsdWVzID0gbGlzdC5maWx0ZXIoKF8sIGkpID0+IGkgJSAyID09PSAxKVxuICAgIHRoaXMuc2VydmVySWQgPSBmcm9tUGFpcnMoemlwKGtleXMsIHZhbHVlcykpXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ1NlcnZlciBpZCB1cGRhdGVkIScsIHRoaXMuc2VydmVySWQpXG4gIH1cblxuICBfc2hvdWxkU2VsZWN0TWFpbGJveCAocGF0aCwgY3R4KSB7XG4gICAgaWYgKCFjdHgpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgY29uc3QgcHJldmlvdXNTZWxlY3QgPSB0aGlzLmNsaWVudC5nZXRQcmV2aW91c2x5UXVldWVkKFsnU0VMRUNUJywgJ0VYQU1JTkUnXSwgY3R4KVxuICAgIGlmIChwcmV2aW91c1NlbGVjdCAmJiBwcmV2aW91c1NlbGVjdC5yZXF1ZXN0LmF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IHBhdGhBdHRyaWJ1dGUgPSBwcmV2aW91c1NlbGVjdC5yZXF1ZXN0LmF0dHJpYnV0ZXMuZmluZCgoYXR0cmlidXRlKSA9PiBhdHRyaWJ1dGUudHlwZSA9PT0gJ1NUUklORycpXG4gICAgICBpZiAocGF0aEF0dHJpYnV0ZSkge1xuICAgICAgICByZXR1cm4gcGF0aEF0dHJpYnV0ZS52YWx1ZSAhPT0gcGF0aFxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9zZWxlY3RlZE1haWxib3ggIT09IHBhdGhcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIFNFTEVDVCBvciBFWEFNSU5FIHRvIG9wZW4gYSBtYWlsYm94XG4gICAqXG4gICAqIFNFTEVDVCBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjMuMVxuICAgKiBFWEFNSU5FIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMy4yXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIEZ1bGwgcGF0aCB0byBtYWlsYm94XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9ucyBvYmplY3RcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgc2VsZWN0ZWQgbWFpbGJveFxuICAgKi9cbiAgYXN5bmMgc2VsZWN0TWFpbGJveCAocGF0aCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgcXVlcnkgPSB7XG4gICAgICBjb21tYW5kOiBvcHRpb25zLnJlYWRPbmx5ID8gJ0VYQU1JTkUnIDogJ1NFTEVDVCcsXG4gICAgICBhdHRyaWJ1dGVzOiBbeyB0eXBlOiAnU1RSSU5HJywgdmFsdWU6IHBhdGggfV1cbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5jb25kc3RvcmUgJiYgdGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdDT05EU1RPUkUnKSA+PSAwKSB7XG4gICAgICBxdWVyeS5hdHRyaWJ1dGVzLnB1c2goW3sgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ0NPTkRTVE9SRScgfV0pXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ09wZW5pbmcnLCBwYXRoLCAnLi4uJylcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyhxdWVyeSwgWydFWElTVFMnLCAnRkxBR1MnLCAnT0snXSwgeyBjdHg6IG9wdGlvbnMuY3R4IH0pXG4gICAgY29uc3QgbWFpbGJveEluZm8gPSBwYXJzZVNFTEVDVChyZXNwb25zZSlcblxuICAgIHRoaXMuX2NoYW5nZVN0YXRlKFNUQVRFX1NFTEVDVEVEKVxuXG4gICAgaWYgKHRoaXMuX3NlbGVjdGVkTWFpbGJveCAhPT0gcGF0aCAmJiB0aGlzLm9uY2xvc2VtYWlsYm94KSB7XG4gICAgICBhd2FpdCB0aGlzLm9uY2xvc2VtYWlsYm94KHRoaXMuX3NlbGVjdGVkTWFpbGJveClcbiAgICB9XG4gICAgdGhpcy5fc2VsZWN0ZWRNYWlsYm94ID0gcGF0aFxuICAgIGlmICh0aGlzLm9uc2VsZWN0bWFpbGJveCkge1xuICAgICAgYXdhaXQgdGhpcy5vbnNlbGVjdG1haWxib3gocGF0aCwgbWFpbGJveEluZm8pXG4gICAgfVxuXG4gICAgcmV0dXJuIG1haWxib3hJbmZvXG4gIH1cblxuICAvKipcbiAgICogUnVucyBOQU1FU1BBQ0UgY29tbWFuZFxuICAgKlxuICAgKiBOQU1FU1BBQ0UgZGV0YWlsczpcbiAgICogICBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMjM0MlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aXRoIG5hbWVzcGFjZSBvYmplY3RcbiAgICovXG4gIGFzeW5jIGxpc3ROYW1lc3BhY2VzICgpIHtcbiAgICBpZiAodGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdOQU1FU1BBQ0UnKSA8IDApIHJldHVybiBmYWxzZVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0xpc3RpbmcgbmFtZXNwYWNlcy4uLicpXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoJ05BTUVTUEFDRScsICdOQU1FU1BBQ0UnKVxuICAgIHJldHVybiBwYXJzZU5BTUVTUEFDRShyZXNwb25zZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIExJU1QgYW5kIExTVUIgY29tbWFuZHMuIFJldHJpZXZlcyBhIHRyZWUgb2YgYXZhaWxhYmxlIG1haWxib3hlc1xuICAgKlxuICAgKiBMSVNUIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMy44XG4gICAqIExTVUIgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4zLjlcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCBsaXN0IG9mIG1haWxib3hlc1xuICAgKi9cbiAgYXN5bmMgbGlzdE1haWxib3hlcyAoKSB7XG4gICAgY29uc3QgdHJlZSA9IHsgcm9vdDogdHJ1ZSwgY2hpbGRyZW46IFtdIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdMaXN0aW5nIG1haWxib3hlcy4uLicpXG4gICAgY29uc3QgbGlzdFJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKHsgY29tbWFuZDogJ0xJU1QnLCBhdHRyaWJ1dGVzOiBbJycsICcqJ10gfSwgJ0xJU1QnKVxuICAgIGNvbnN0IGxpc3QgPSBwYXRoT3IoW10sIFsncGF5bG9hZCcsICdMSVNUJ10sIGxpc3RSZXNwb25zZSlcbiAgICBsaXN0LmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBjb25zdCBhdHRyID0gcHJvcE9yKFtdLCAnYXR0cmlidXRlcycsIGl0ZW0pXG4gICAgICBpZiAoYXR0ci5sZW5ndGggPCAzKSByZXR1cm5cblxuICAgICAgY29uc3QgcGF0aCA9IHBhdGhPcignJywgWycyJywgJ3ZhbHVlJ10sIGF0dHIpXG4gICAgICBjb25zdCBkZWxpbSA9IHBhdGhPcignLycsIFsnMScsICd2YWx1ZSddLCBhdHRyKVxuICAgICAgY29uc3QgYnJhbmNoID0gdGhpcy5fZW5zdXJlUGF0aCh0cmVlLCBwYXRoLCBkZWxpbSlcbiAgICAgIGJyYW5jaC5mbGFncyA9IHByb3BPcihbXSwgJzAnLCBhdHRyKS5tYXAoKHsgdmFsdWUgfSkgPT4gdmFsdWUgfHwgJycpXG4gICAgICBicmFuY2gubGlzdGVkID0gdHJ1ZVxuICAgICAgY2hlY2tTcGVjaWFsVXNlKGJyYW5jaClcbiAgICB9KVxuXG4gICAgY29uc3QgbHN1YlJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKHsgY29tbWFuZDogJ0xTVUInLCBhdHRyaWJ1dGVzOiBbJycsICcqJ10gfSwgJ0xTVUInKVxuICAgIGNvbnN0IGxzdWIgPSBwYXRoT3IoW10sIFsncGF5bG9hZCcsICdMU1VCJ10sIGxzdWJSZXNwb25zZSlcbiAgICBsc3ViLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIGNvbnN0IGF0dHIgPSBwcm9wT3IoW10sICdhdHRyaWJ1dGVzJywgaXRlbSlcbiAgICAgIGlmIChhdHRyLmxlbmd0aCA8IDMpIHJldHVyblxuXG4gICAgICBjb25zdCBwYXRoID0gcGF0aE9yKCcnLCBbJzInLCAndmFsdWUnXSwgYXR0cilcbiAgICAgIGNvbnN0IGRlbGltID0gcGF0aE9yKCcvJywgWycxJywgJ3ZhbHVlJ10sIGF0dHIpXG4gICAgICBjb25zdCBicmFuY2ggPSB0aGlzLl9lbnN1cmVQYXRoKHRyZWUsIHBhdGgsIGRlbGltKVxuICAgICAgcHJvcE9yKFtdLCAnMCcsIGF0dHIpLm1hcCgoZmxhZyA9ICcnKSA9PiB7IGJyYW5jaC5mbGFncyA9IHVuaW9uKGJyYW5jaC5mbGFncywgW2ZsYWddKSB9KVxuICAgICAgYnJhbmNoLnN1YnNjcmliZWQgPSB0cnVlXG4gICAgfSlcblxuICAgIHJldHVybiB0cmVlXG4gIH1cblxuICAvKipcbiAgICogUnVucyBtYWlsYm94IFNUQVRVU1xuICAgKlxuICAgKiBTVEFUVVMgZGV0YWlsczpcbiAgICogIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4zLjEwXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIEZ1bGwgcGF0aCB0byBtYWlsYm94XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9ucyBvYmplY3RcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgc2VsZWN0ZWQgbWFpbGJveFxuICAgKi9cbiAgYXN5bmMgbWFpbGJveFN0YXR1cyAocGF0aCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3Qgc3RhdHVzRGF0YUl0ZW1zID0gWydVSURORVhUJywgJ01FU1NBR0VTJ11cblxuICAgIGlmIChvcHRpb25zLmNvbmRzdG9yZSAmJiB0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ0NPTkRTVE9SRScpID49IDApIHtcbiAgICAgIHN0YXR1c0RhdGFJdGVtcy5wdXNoKCdISUdIRVNUTU9EU0VRJylcbiAgICB9XG5cbiAgICBjb25zdCBzdGF0dXNBdHRyaWJ1dGVzID0gc3RhdHVzRGF0YUl0ZW1zLm1hcCgoc3RhdHVzRGF0YUl0ZW0pID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgdmFsdWU6IHN0YXR1c0RhdGFJdGVtXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdPcGVuaW5nJywgcGF0aCwgJy4uLicpXG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyh7XG4gICAgICBjb21tYW5kOiAnU1RBVFVTJyxcbiAgICAgIGF0dHJpYnV0ZXM6IFtcbiAgICAgICAgeyB0eXBlOiAnU1RSSU5HJywgdmFsdWU6IHBhdGggfSxcbiAgICAgICAgWy4uLnN0YXR1c0F0dHJpYnV0ZXNdXG4gICAgICBdXG4gICAgfSwgWydTVEFUVVMnXSlcblxuICAgIHJldHVybiBwYXJzZVNUQVRVUyhyZXNwb25zZSwgc3RhdHVzRGF0YUl0ZW1zKVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG1haWxib3ggd2l0aCB0aGUgZ2l2ZW4gcGF0aC5cbiAgICpcbiAgICogQ1JFQVRFIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMy4zXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqICAgICBUaGUgcGF0aCBvZiB0aGUgbWFpbGJveCB5b3Ugd291bGQgbGlrZSB0byBjcmVhdGUuICBUaGlzIG1ldGhvZCB3aWxsXG4gICAqICAgICBoYW5kbGUgdXRmNyBlbmNvZGluZyBmb3IgeW91LlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICogICAgIFByb21pc2UgcmVzb2x2ZXMgaWYgbWFpbGJveCB3YXMgY3JlYXRlZC5cbiAgICogICAgIEluIHRoZSBldmVudCB0aGUgc2VydmVyIHNheXMgTk8gW0FMUkVBRFlFWElTVFNdLCB3ZSB0cmVhdCB0aGF0IGFzIHN1Y2Nlc3MuXG4gICAqL1xuICBhc3luYyBjcmVhdGVNYWlsYm94IChwYXRoKSB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0NyZWF0aW5nIG1haWxib3gnLCBwYXRoLCAnLi4uJylcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5leGVjKHsgY29tbWFuZDogJ0NSRUFURScsIGF0dHJpYnV0ZXM6IFtpbWFwRW5jb2RlKHBhdGgpXSB9KVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKGVyciAmJiBlcnIuY29kZSA9PT0gJ0FMUkVBRFlFWElTVFMnKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdGhyb3cgZXJyXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIG1haWxib3ggd2l0aCB0aGUgZ2l2ZW4gcGF0aC5cbiAgICpcbiAgICogREVMRVRFIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjMuNFxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiAgICAgVGhlIHBhdGggb2YgdGhlIG1haWxib3ggeW91IHdvdWxkIGxpa2UgdG8gZGVsZXRlLiAgVGhpcyBtZXRob2Qgd2lsbFxuICAgKiAgICAgaGFuZGxlIHV0ZjcgZW5jb2RpbmcgZm9yIHlvdS5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqICAgICBQcm9taXNlIHJlc29sdmVzIGlmIG1haWxib3ggd2FzIGRlbGV0ZWQuXG4gICAqL1xuICBkZWxldGVNYWlsYm94IChwYXRoKSB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0RlbGV0aW5nIG1haWxib3gnLCBwYXRoLCAnLi4uJylcbiAgICByZXR1cm4gdGhpcy5leGVjKHsgY29tbWFuZDogJ0RFTEVURScsIGF0dHJpYnV0ZXM6IFtpbWFwRW5jb2RlKHBhdGgpXSB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgRkVUQ0ggY29tbWFuZFxuICAgKlxuICAgKiBGRVRDSCBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjQuNVxuICAgKiBDSEFOR0VEU0lOQ0UgZGV0YWlsczpcbiAgICogICBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNDU1MSNzZWN0aW9uLTMuM1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUaGUgcGF0aCBmb3IgdGhlIG1haWxib3ggd2hpY2ggc2hvdWxkIGJlIHNlbGVjdGVkIGZvciB0aGUgY29tbWFuZC4gU2VsZWN0cyBtYWlsYm94IGlmIG5lY2Vzc2FyeVxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VxdWVuY2UgU2VxdWVuY2Ugc2V0LCBlZyAxOiogZm9yIGFsbCBtZXNzYWdlc1xuICAgKiBAcGFyYW0ge09iamVjdH0gW2l0ZW1zXSBNZXNzYWdlIGRhdGEgaXRlbSBuYW1lcyBvciBtYWNyb1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG1vZGlmaWVyc1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aXRoIHRoZSBmZXRjaGVkIG1lc3NhZ2UgaW5mb1xuICAgKi9cbiAgYXN5bmMgbGlzdE1lc3NhZ2VzIChwYXRoLCBzZXF1ZW5jZSwgaXRlbXMgPSBbeyBmYXN0OiB0cnVlIH1dLCBvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnRmV0Y2hpbmcgbWVzc2FnZXMnLCBzZXF1ZW5jZSwgJ2Zyb20nLCBwYXRoLCAnLi4uJylcbiAgICBjb25zdCBjb21tYW5kID0gYnVpbGRGRVRDSENvbW1hbmQoc2VxdWVuY2UsIGl0ZW1zLCBvcHRpb25zKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKGNvbW1hbmQsICdGRVRDSCcsIHtcbiAgICAgIHByZWNoZWNrOiAoY3R4KSA9PiB0aGlzLl9zaG91bGRTZWxlY3RNYWlsYm94KHBhdGgsIGN0eCkgPyB0aGlzLnNlbGVjdE1haWxib3gocGF0aCwgeyBjdHggfSkgOiBQcm9taXNlLnJlc29sdmUoKVxuICAgIH0pXG4gICAgcmV0dXJuIHBhcnNlRkVUQ0gocmVzcG9uc2UpXG4gIH1cblxuICAvKipcbiAgICogUnVucyBTRUFSQ0ggY29tbWFuZFxuICAgKlxuICAgKiBTRUFSQ0ggZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi40LjRcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGhlIHBhdGggZm9yIHRoZSBtYWlsYm94IHdoaWNoIHNob3VsZCBiZSBzZWxlY3RlZCBmb3IgdGhlIGNvbW1hbmQuIFNlbGVjdHMgbWFpbGJveCBpZiBuZWNlc3NhcnlcbiAgICogQHBhcmFtIHtPYmplY3R9IHF1ZXJ5IFNlYXJjaCB0ZXJtc1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG1vZGlmaWVyc1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aXRoIHRoZSBhcnJheSBvZiBtYXRjaGluZyBzZXEuIG9yIHVpZCBudW1iZXJzXG4gICAqL1xuICBhc3luYyBzZWFyY2ggKHBhdGgsIHF1ZXJ5LCBvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnU2VhcmNoaW5nIGluJywgcGF0aCwgJy4uLicpXG4gICAgY29uc3QgY29tbWFuZCA9IGJ1aWxkU0VBUkNIQ29tbWFuZChxdWVyeSwgb3B0aW9ucylcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyhjb21tYW5kLCAnU0VBUkNIJywge1xuICAgICAgcHJlY2hlY2s6IChjdHgpID0+IHRoaXMuX3Nob3VsZFNlbGVjdE1haWxib3gocGF0aCwgY3R4KSA/IHRoaXMuc2VsZWN0TWFpbGJveChwYXRoLCB7IGN0eCB9KSA6IFByb21pc2UucmVzb2x2ZSgpXG4gICAgfSlcbiAgICByZXR1cm4gcGFyc2VTRUFSQ0gocmVzcG9uc2UpXG4gIH1cblxuICAvKipcbiAgICogUnVucyBTVE9SRSBjb21tYW5kXG4gICAqXG4gICAqIFNUT1JFIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuNC42XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRoZSBwYXRoIGZvciB0aGUgbWFpbGJveCB3aGljaCBzaG91bGQgYmUgc2VsZWN0ZWQgZm9yIHRoZSBjb21tYW5kLiBTZWxlY3RzIG1haWxib3ggaWYgbmVjZXNzYXJ5XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzZXF1ZW5jZSBNZXNzYWdlIHNlbGVjdG9yIHdoaWNoIHRoZSBmbGFnIGNoYW5nZSBpcyBhcHBsaWVkIHRvXG4gICAqIEBwYXJhbSB7QXJyYXl9IGZsYWdzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgbW9kaWZpZXJzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdpdGggdGhlIGFycmF5IG9mIG1hdGNoaW5nIHNlcS4gb3IgdWlkIG51bWJlcnNcbiAgICovXG4gIHNldEZsYWdzIChwYXRoLCBzZXF1ZW5jZSwgZmxhZ3MsIG9wdGlvbnMpIHtcbiAgICBsZXQga2V5ID0gJydcbiAgICBsZXQgbGlzdCA9IFtdXG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShmbGFncykgfHwgdHlwZW9mIGZsYWdzICE9PSAnb2JqZWN0Jykge1xuICAgICAgbGlzdCA9IFtdLmNvbmNhdChmbGFncyB8fCBbXSlcbiAgICAgIGtleSA9ICcnXG4gICAgfSBlbHNlIGlmIChmbGFncy5hZGQpIHtcbiAgICAgIGxpc3QgPSBbXS5jb25jYXQoZmxhZ3MuYWRkIHx8IFtdKVxuICAgICAga2V5ID0gJysnXG4gICAgfSBlbHNlIGlmIChmbGFncy5zZXQpIHtcbiAgICAgIGtleSA9ICcnXG4gICAgICBsaXN0ID0gW10uY29uY2F0KGZsYWdzLnNldCB8fCBbXSlcbiAgICB9IGVsc2UgaWYgKGZsYWdzLnJlbW92ZSkge1xuICAgICAga2V5ID0gJy0nXG4gICAgICBsaXN0ID0gW10uY29uY2F0KGZsYWdzLnJlbW92ZSB8fCBbXSlcbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnU2V0dGluZyBmbGFncyBvbicsIHNlcXVlbmNlLCAnaW4nLCBwYXRoLCAnLi4uJylcbiAgICByZXR1cm4gdGhpcy5zdG9yZShwYXRoLCBzZXF1ZW5jZSwga2V5ICsgJ0ZMQUdTJywgbGlzdCwgb3B0aW9ucylcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIFNUT1JFIGNvbW1hbmRcbiAgICpcbiAgICogU1RPUkUgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi40LjZcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGhlIHBhdGggZm9yIHRoZSBtYWlsYm94IHdoaWNoIHNob3VsZCBiZSBzZWxlY3RlZCBmb3IgdGhlIGNvbW1hbmQuIFNlbGVjdHMgbWFpbGJveCBpZiBuZWNlc3NhcnlcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNlcXVlbmNlIE1lc3NhZ2Ugc2VsZWN0b3Igd2hpY2ggdGhlIGZsYWcgY2hhbmdlIGlzIGFwcGxpZWQgdG9cbiAgICogQHBhcmFtIHtTdHJpbmd9IGFjdGlvbiBTVE9SRSBtZXRob2QgdG8gY2FsbCwgZWcgXCIrRkxBR1NcIlxuICAgKiBAcGFyYW0ge0FycmF5fSBmbGFnc1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG1vZGlmaWVyc1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aXRoIHRoZSBhcnJheSBvZiBtYXRjaGluZyBzZXEuIG9yIHVpZCBudW1iZXJzXG4gICAqL1xuICBhc3luYyBzdG9yZSAocGF0aCwgc2VxdWVuY2UsIGFjdGlvbiwgZmxhZ3MsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IGNvbW1hbmQgPSBidWlsZFNUT1JFQ29tbWFuZChzZXF1ZW5jZSwgYWN0aW9uLCBmbGFncywgb3B0aW9ucylcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyhjb21tYW5kLCAnRkVUQ0gnLCB7XG4gICAgICBwcmVjaGVjazogKGN0eCkgPT4gdGhpcy5fc2hvdWxkU2VsZWN0TWFpbGJveChwYXRoLCBjdHgpID8gdGhpcy5zZWxlY3RNYWlsYm94KHBhdGgsIHsgY3R4IH0pIDogUHJvbWlzZS5yZXNvbHZlKClcbiAgICB9KVxuICAgIHJldHVybiBwYXJzZUZFVENIKHJlc3BvbnNlKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgQVBQRU5EIGNvbW1hbmRcbiAgICpcbiAgICogQVBQRU5EIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMy4xMVxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gZGVzdGluYXRpb24gVGhlIG1haWxib3ggd2hlcmUgdG8gYXBwZW5kIHRoZSBtZXNzYWdlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIGFwcGVuZFxuICAgKiBAcGFyYW0ge0FycmF5fSBvcHRpb25zLmZsYWdzIEFueSBmbGFncyB5b3Ugd2FudCB0byBzZXQgb24gdGhlIHVwbG9hZGVkIG1lc3NhZ2UuIERlZmF1bHRzIHRvIFtcXFNlZW5dLiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdpdGggdGhlIGFycmF5IG9mIG1hdGNoaW5nIHNlcS4gb3IgdWlkIG51bWJlcnNcbiAgICovXG4gIGFzeW5jIHVwbG9hZCAoZGVzdGluYXRpb24sIG1lc3NhZ2UsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IGZsYWdzID0gcHJvcE9yKFsnXFxcXFNlZW4nXSwgJ2ZsYWdzJywgb3B0aW9ucykubWFwKHZhbHVlID0+ICh7IHR5cGU6ICdhdG9tJywgdmFsdWUgfSkpXG4gICAgY29uc3QgY29tbWFuZCA9IHtcbiAgICAgIGNvbW1hbmQ6ICdBUFBFTkQnLFxuICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICB7IHR5cGU6ICdhdG9tJywgdmFsdWU6IGRlc3RpbmF0aW9uIH0sXG4gICAgICAgIGZsYWdzLFxuICAgICAgICB7IHR5cGU6ICdsaXRlcmFsJywgdmFsdWU6IG1lc3NhZ2UgfVxuICAgICAgXVxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdVcGxvYWRpbmcgbWVzc2FnZSB0bycsIGRlc3RpbmF0aW9uLCAnLi4uJylcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyhjb21tYW5kKVxuICAgIHJldHVybiBwYXJzZUFQUEVORChyZXNwb25zZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIG1lc3NhZ2VzIGZyb20gYSBzZWxlY3RlZCBtYWlsYm94XG4gICAqXG4gICAqIEVYUFVOR0UgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi40LjNcbiAgICogVUlEIEVYUFVOR0UgZGV0YWlsczpcbiAgICogICBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNDMxNSNzZWN0aW9uLTIuMVxuICAgKlxuICAgKiBJZiBwb3NzaWJsZSAoYnlVaWQ6dHJ1ZSBhbmQgVUlEUExVUyBleHRlbnNpb24gc3VwcG9ydGVkKSwgdXNlcyBVSUQgRVhQVU5HRVxuICAgKiBjb21tYW5kIHRvIGRlbGV0ZSBhIHJhbmdlIG9mIG1lc3NhZ2VzLCBvdGhlcndpc2UgZmFsbHMgYmFjayB0byBFWFBVTkdFLlxuICAgKlxuICAgKiBOQiEgVGhpcyBtZXRob2QgbWlnaHQgYmUgZGVzdHJ1Y3RpdmUgLSBpZiBFWFBVTkdFIGlzIHVzZWQsIHRoZW4gYW55IG1lc3NhZ2VzXG4gICAqIHdpdGggXFxEZWxldGVkIGZsYWcgc2V0IGFyZSBkZWxldGVkXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRoZSBwYXRoIGZvciB0aGUgbWFpbGJveCB3aGljaCBzaG91bGQgYmUgc2VsZWN0ZWQgZm9yIHRoZSBjb21tYW5kLiBTZWxlY3RzIG1haWxib3ggaWYgbmVjZXNzYXJ5XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzZXF1ZW5jZSBNZXNzYWdlIHJhbmdlIHRvIGJlIGRlbGV0ZWRcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBtb2RpZmllcnNcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2VcbiAgICovXG4gIGFzeW5jIGRlbGV0ZU1lc3NhZ2VzIChwYXRoLCBzZXF1ZW5jZSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgLy8gYWRkIFxcRGVsZXRlZCBmbGFnIHRvIHRoZSBtZXNzYWdlcyBhbmQgcnVuIEVYUFVOR0Ugb3IgVUlEIEVYUFVOR0VcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnRGVsZXRpbmcgbWVzc2FnZXMnLCBzZXF1ZW5jZSwgJ2luJywgcGF0aCwgJy4uLicpXG4gICAgY29uc3QgdXNlVWlkUGx1cyA9IG9wdGlvbnMuYnlVaWQgJiYgdGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdVSURQTFVTJykgPj0gMFxuICAgIGNvbnN0IHVpZEV4cHVuZ2VDb21tYW5kID0geyBjb21tYW5kOiAnVUlEIEVYUFVOR0UnLCBhdHRyaWJ1dGVzOiBbeyB0eXBlOiAnc2VxdWVuY2UnLCB2YWx1ZTogc2VxdWVuY2UgfV0gfVxuICAgIGF3YWl0IHRoaXMuc2V0RmxhZ3MocGF0aCwgc2VxdWVuY2UsIHsgYWRkOiAnXFxcXERlbGV0ZWQnIH0sIG9wdGlvbnMpXG4gICAgY29uc3QgY21kID0gdXNlVWlkUGx1cyA/IHVpZEV4cHVuZ2VDb21tYW5kIDogJ0VYUFVOR0UnXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhjbWQsIG51bGwsIHtcbiAgICAgIHByZWNoZWNrOiAoY3R4KSA9PiB0aGlzLl9zaG91bGRTZWxlY3RNYWlsYm94KHBhdGgsIGN0eCkgPyB0aGlzLnNlbGVjdE1haWxib3gocGF0aCwgeyBjdHggfSkgOiBQcm9taXNlLnJlc29sdmUoKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIGEgcmFuZ2Ugb2YgbWVzc2FnZXMgZnJvbSB0aGUgYWN0aXZlIG1haWxib3ggdG8gdGhlIGRlc3RpbmF0aW9uIG1haWxib3guXG4gICAqIFNpbGVudCBtZXRob2QgKHVubGVzcyBhbiBlcnJvciBvY2N1cnMpLCBieSBkZWZhdWx0IHJldHVybnMgbm8gaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIENPUFkgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi40LjdcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGhlIHBhdGggZm9yIHRoZSBtYWlsYm94IHdoaWNoIHNob3VsZCBiZSBzZWxlY3RlZCBmb3IgdGhlIGNvbW1hbmQuIFNlbGVjdHMgbWFpbGJveCBpZiBuZWNlc3NhcnlcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNlcXVlbmNlIE1lc3NhZ2UgcmFuZ2UgdG8gYmUgY29waWVkXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBkZXN0aW5hdGlvbiBEZXN0aW5hdGlvbiBtYWlsYm94IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBtb2RpZmllcnNcbiAgICogQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy5ieVVpZF0gSWYgdHJ1ZSwgdXNlcyBVSUQgQ09QWSBpbnN0ZWFkIG9mIENPUFlcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2VcbiAgICovXG4gIGFzeW5jIGNvcHlNZXNzYWdlcyAocGF0aCwgc2VxdWVuY2UsIGRlc3RpbmF0aW9uLCBvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnQ29weWluZyBtZXNzYWdlcycsIHNlcXVlbmNlLCAnZnJvbScsIHBhdGgsICd0bycsIGRlc3RpbmF0aW9uLCAnLi4uJylcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyh7XG4gICAgICBjb21tYW5kOiBvcHRpb25zLmJ5VWlkID8gJ1VJRCBDT1BZJyA6ICdDT1BZJyxcbiAgICAgIGF0dHJpYnV0ZXM6IFtcbiAgICAgICAgeyB0eXBlOiAnc2VxdWVuY2UnLCB2YWx1ZTogc2VxdWVuY2UgfSxcbiAgICAgICAgeyB0eXBlOiAnYXRvbScsIHZhbHVlOiBkZXN0aW5hdGlvbiB9XG4gICAgICBdXG4gICAgfSwgbnVsbCwge1xuICAgICAgcHJlY2hlY2s6IChjdHgpID0+IHRoaXMuX3Nob3VsZFNlbGVjdE1haWxib3gocGF0aCwgY3R4KSA/IHRoaXMuc2VsZWN0TWFpbGJveChwYXRoLCB7IGN0eCB9KSA6IFByb21pc2UucmVzb2x2ZSgpXG4gICAgfSlcbiAgICByZXR1cm4gcGFyc2VDT1BZKHJlc3BvbnNlKVxuICB9XG5cbiAgLyoqXG4gICAqIE1vdmVzIGEgcmFuZ2Ugb2YgbWVzc2FnZXMgZnJvbSB0aGUgYWN0aXZlIG1haWxib3ggdG8gdGhlIGRlc3RpbmF0aW9uIG1haWxib3guXG4gICAqIFByZWZlcnMgdGhlIE1PVkUgZXh0ZW5zaW9uIGJ1dCBpZiBub3QgYXZhaWxhYmxlLCBmYWxscyBiYWNrIHRvXG4gICAqIENPUFkgKyBFWFBVTkdFXG4gICAqXG4gICAqIE1PVkUgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM2ODUxXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRoZSBwYXRoIGZvciB0aGUgbWFpbGJveCB3aGljaCBzaG91bGQgYmUgc2VsZWN0ZWQgZm9yIHRoZSBjb21tYW5kLiBTZWxlY3RzIG1haWxib3ggaWYgbmVjZXNzYXJ5XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzZXF1ZW5jZSBNZXNzYWdlIHJhbmdlIHRvIGJlIG1vdmVkXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBkZXN0aW5hdGlvbiBEZXN0aW5hdGlvbiBtYWlsYm94IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBtb2RpZmllcnNcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2VcbiAgICovXG4gIGFzeW5jIG1vdmVNZXNzYWdlcyAocGF0aCwgc2VxdWVuY2UsIGRlc3RpbmF0aW9uLCBvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnTW92aW5nIG1lc3NhZ2VzJywgc2VxdWVuY2UsICdmcm9tJywgcGF0aCwgJ3RvJywgZGVzdGluYXRpb24sICcuLi4nKVxuXG4gICAgaWYgKHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZignTU9WRScpID09PSAtMSkge1xuICAgICAgLy8gRmFsbGJhY2sgdG8gQ09QWSArIEVYUFVOR0VcbiAgICAgIGF3YWl0IHRoaXMuY29weU1lc3NhZ2VzKHBhdGgsIHNlcXVlbmNlLCBkZXN0aW5hdGlvbiwgb3B0aW9ucylcbiAgICAgIHJldHVybiB0aGlzLmRlbGV0ZU1lc3NhZ2VzKHBhdGgsIHNlcXVlbmNlLCBvcHRpb25zKVxuICAgIH1cblxuICAgIC8vIElmIHBvc3NpYmxlLCB1c2UgTU9WRVxuICAgIHJldHVybiB0aGlzLmV4ZWMoe1xuICAgICAgY29tbWFuZDogb3B0aW9ucy5ieVVpZCA/ICdVSUQgTU9WRScgOiAnTU9WRScsXG4gICAgICBhdHRyaWJ1dGVzOiBbXG4gICAgICAgIHsgdHlwZTogJ3NlcXVlbmNlJywgdmFsdWU6IHNlcXVlbmNlIH0sXG4gICAgICAgIHsgdHlwZTogJ2F0b20nLCB2YWx1ZTogZGVzdGluYXRpb24gfVxuICAgICAgXVxuICAgIH0sIFsnT0snXSwge1xuICAgICAgcHJlY2hlY2s6IChjdHgpID0+IHRoaXMuX3Nob3VsZFNlbGVjdE1haWxib3gocGF0aCwgY3R4KSA/IHRoaXMuc2VsZWN0TWFpbGJveChwYXRoLCB7IGN0eCB9KSA6IFByb21pc2UucmVzb2x2ZSgpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIENPTVBSRVNTIGNvbW1hbmRcbiAgICpcbiAgICogQ09NUFJFU1MgZGV0YWlsczpcbiAgICogICBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNDk3OFxuICAgKi9cbiAgYXN5bmMgY29tcHJlc3NDb25uZWN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuX2VuYWJsZUNvbXByZXNzaW9uIHx8IHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZignQ09NUFJFU1M9REVGTEFURScpIDwgMCB8fCB0aGlzLmNsaWVudC5jb21wcmVzc2VkKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnRW5hYmxpbmcgY29tcHJlc3Npb24uLi4nKVxuICAgIGF3YWl0IHRoaXMuZXhlYyh7XG4gICAgICBjb21tYW5kOiAnQ09NUFJFU1MnLFxuICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgdHlwZTogJ0FUT00nLFxuICAgICAgICB2YWx1ZTogJ0RFRkxBVEUnXG4gICAgICB9XVxuICAgIH0pXG4gICAgdGhpcy5jbGllbnQuZW5hYmxlQ29tcHJlc3Npb24oKVxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdDb21wcmVzc2lvbiBlbmFibGVkLCBhbGwgZGF0YSBzZW50IGFuZCByZWNlaXZlZCBpcyBkZWZsYXRlZCEnKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgTE9HSU4gb3IgQVVUSEVOVElDQVRFIFhPQVVUSDIgY29tbWFuZFxuICAgKlxuICAgKiBMT0dJTiBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjIuM1xuICAgKiBYT0FVVEgyIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vZ21haWwveG9hdXRoMl9wcm90b2NvbCNpbWFwX3Byb3RvY29sX2V4Y2hhbmdlXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBhdXRoLnVzZXJcbiAgICogQHBhcmFtIHtTdHJpbmd9IGF1dGgucGFzc1xuICAgKiBAcGFyYW0ge1N0cmluZ30gYXV0aC54b2F1dGgyXG4gICAqL1xuICBhc3luYyBsb2dpbiAoYXV0aCkge1xuICAgIGxldCBjb21tYW5kXG4gICAgY29uc3Qgb3B0aW9ucyA9IHt9XG5cbiAgICBpZiAoIWF1dGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQXV0aGVudGljYXRpb24gaW5mb3JtYXRpb24gbm90IHByb3ZpZGVkJylcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdBVVRIPVhPQVVUSDInKSA+PSAwICYmIGF1dGggJiYgYXV0aC54b2F1dGgyKSB7XG4gICAgICBjb21tYW5kID0ge1xuICAgICAgICBjb21tYW5kOiAnQVVUSEVOVElDQVRFJyxcbiAgICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ1hPQVVUSDInIH0sXG4gICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiBidWlsZFhPQXV0aDJUb2tlbihhdXRoLnVzZXIsIGF1dGgueG9hdXRoMiksIHNlbnNpdGl2ZTogdHJ1ZSB9XG4gICAgICAgIF1cbiAgICAgIH1cblxuICAgICAgb3B0aW9ucy5lcnJvclJlc3BvbnNlRXhwZWN0c0VtcHR5TGluZSA9IHRydWUgLy8gKyB0YWdnZWQgZXJyb3IgcmVzcG9uc2UgZXhwZWN0cyBhbiBlbXB0eSBsaW5lIGluIHJldHVyblxuICAgIH0gZWxzZSB7XG4gICAgICBjb21tYW5kID0ge1xuICAgICAgICBjb21tYW5kOiAnbG9naW4nLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbXG4gICAgICAgICAgeyB0eXBlOiAnU1RSSU5HJywgdmFsdWU6IGF1dGgudXNlciB8fCAnJyB9LFxuICAgICAgICAgIHsgdHlwZTogJ1NUUklORycsIHZhbHVlOiBhdXRoLnBhc3MgfHwgJycsIHNlbnNpdGl2ZTogdHJ1ZSB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnTG9nZ2luZyBpbi4uLicpXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoY29tbWFuZCwgJ2NhcGFiaWxpdHknLCBvcHRpb25zKVxuICAgIC8qXG4gICAgICogdXBkYXRlIHBvc3QtYXV0aCBjYXBhYmlsaXRlc1xuICAgICAqIGNhcGFiaWxpdHkgbGlzdCBzaG91bGRuJ3QgY29udGFpbiBhdXRoIHJlbGF0ZWQgc3R1ZmYgYW55bW9yZVxuICAgICAqIGJ1dCBzb21lIG5ldyBleHRlbnNpb25zIG1pZ2h0IGhhdmUgcG9wcGVkIHVwIHRoYXQgZG8gbm90XG4gICAgICogbWFrZSBtdWNoIHNlbnNlIGluIHRoZSBub24tYXV0aCBzdGF0ZVxuICAgICAqL1xuICAgIGlmIChyZXNwb25zZS5jYXBhYmlsaXR5ICYmIHJlc3BvbnNlLmNhcGFiaWxpdHkubGVuZ3RoKSB7XG4gICAgICAvLyBjYXBhYmlsaXRlcyB3ZXJlIGxpc3RlZCB3aXRoIHRoZSBPSyBbQ0FQQUJJTElUWSAuLi5dIHJlc3BvbnNlXG4gICAgICB0aGlzLl9jYXBhYmlsaXR5ID0gcmVzcG9uc2UuY2FwYWJpbGl0eVxuICAgIH0gZWxzZSBpZiAocmVzcG9uc2UucGF5bG9hZCAmJiByZXNwb25zZS5wYXlsb2FkLkNBUEFCSUxJVFkgJiYgcmVzcG9uc2UucGF5bG9hZC5DQVBBQklMSVRZLmxlbmd0aCkge1xuICAgICAgLy8gY2FwYWJpbGl0ZXMgd2VyZSBsaXN0ZWQgd2l0aCAqIENBUEFCSUxJVFkgLi4uIHJlc3BvbnNlXG4gICAgICB0aGlzLl9jYXBhYmlsaXR5ID0gcmVzcG9uc2UucGF5bG9hZC5DQVBBQklMSVRZLnBvcCgpLmF0dHJpYnV0ZXMubWFwKChjYXBhID0gJycpID0+IGNhcGEudmFsdWUudG9VcHBlckNhc2UoKS50cmltKCkpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGNhcGFiaWxpdGllcyB3ZXJlIG5vdCBhdXRvbWF0aWNhbGx5IGxpc3RlZCwgcmVsb2FkXG4gICAgICBhd2FpdCB0aGlzLnVwZGF0ZUNhcGFiaWxpdHkodHJ1ZSlcbiAgICB9XG5cbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZShTVEFURV9BVVRIRU5USUNBVEVEKVxuICAgIHRoaXMuX2F1dGhlbnRpY2F0ZWQgPSB0cnVlXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0xvZ2luIHN1Y2Nlc3NmdWwsIHBvc3QtYXV0aCBjYXBhYmlsaXRlcyB1cGRhdGVkIScsIHRoaXMuX2NhcGFiaWxpdHkpXG4gIH1cblxuICAvKipcbiAgICogUnVuIGFuIElNQVAgY29tbWFuZC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlcXVlc3QgU3RydWN0dXJlZCByZXF1ZXN0IG9iamVjdFxuICAgKiBAcGFyYW0ge0FycmF5fSBhY2NlcHRVbnRhZ2dlZCBhIGxpc3Qgb2YgdW50YWdnZWQgcmVzcG9uc2VzIHRoYXQgd2lsbCBiZSBpbmNsdWRlZCBpbiAncGF5bG9hZCcgcHJvcGVydHlcbiAgICovXG4gIGFzeW5jIGV4ZWMgKHJlcXVlc3QsIGFjY2VwdFVudGFnZ2VkLCBvcHRpb25zKSB7XG4gICAgdGhpcy5icmVha0lkbGUoKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5jbGllbnQuZW5xdWV1ZUNvbW1hbmQocmVxdWVzdCwgYWNjZXB0VW50YWdnZWQsIG9wdGlvbnMpXG4gICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmNhcGFiaWxpdHkpIHtcbiAgICAgIHRoaXMuX2NhcGFiaWxpdHkgPSByZXNwb25zZS5jYXBhYmlsaXR5XG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBjb25uZWN0aW9uIGlzIGlkbGluZy4gU2VuZHMgYSBOT09QIG9yIElETEUgY29tbWFuZFxuICAgKlxuICAgKiBJRExFIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzIxNzdcbiAgICovXG4gIGVudGVySWRsZSAoKSB7XG4gICAgaWYgKHRoaXMuX2VudGVyZWRJZGxlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3Qgc3VwcG9ydHNJZGxlID0gdGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdJRExFJykgPj0gMFxuICAgIHRoaXMuX2VudGVyZWRJZGxlID0gc3VwcG9ydHNJZGxlICYmIHRoaXMuX3NlbGVjdGVkTWFpbGJveCA/ICdJRExFJyA6ICdOT09QJ1xuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdFbnRlcmluZyBpZGxlIHdpdGggJyArIHRoaXMuX2VudGVyZWRJZGxlKVxuXG4gICAgaWYgKHRoaXMuX2VudGVyZWRJZGxlID09PSAnTk9PUCcpIHtcbiAgICAgIHRoaXMuX2lkbGVUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdTZW5kaW5nIE5PT1AnKVxuICAgICAgICB0aGlzLmV4ZWMoJ05PT1AnKVxuICAgICAgfSwgdGhpcy50aW1lb3V0Tm9vcClcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2VudGVyZWRJZGxlID09PSAnSURMRScpIHtcbiAgICAgIHRoaXMuY2xpZW50LmVucXVldWVDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogJ0lETEUnXG4gICAgICB9KVxuICAgICAgdGhpcy5faWRsZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5jbGllbnQuc2VuZCgnRE9ORVxcclxcbicpXG4gICAgICAgIHRoaXMuX2VudGVyZWRJZGxlID0gZmFsc2VcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ0lkbGUgdGVybWluYXRlZCcpXG4gICAgICB9LCB0aGlzLnRpbWVvdXRJZGxlKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBhY3Rpb25zIHJlbGF0ZWQgaWRsaW5nLCBpZiBJRExFIGlzIHN1cHBvcnRlZCwgc2VuZHMgRE9ORSB0byBzdG9wIGl0XG4gICAqL1xuICBicmVha0lkbGUgKCkge1xuICAgIGlmICghdGhpcy5fZW50ZXJlZElkbGUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNsZWFyVGltZW91dCh0aGlzLl9pZGxlVGltZW91dClcbiAgICBpZiAodGhpcy5fZW50ZXJlZElkbGUgPT09ICdJRExFJykge1xuICAgICAgdGhpcy5jbGllbnQuc2VuZCgnRE9ORVxcclxcbicpXG4gICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnSWRsZSB0ZXJtaW5hdGVkJylcbiAgICB9XG4gICAgdGhpcy5fZW50ZXJlZElkbGUgPSBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgU1RBUlRUTFMgY29tbWFuZCBpZiBuZWVkZWRcbiAgICpcbiAgICogU1RBUlRUTFMgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4yLjFcbiAgICpcbiAgICogQHBhcmFtIHtCb29sZWFufSBbZm9yY2VkXSBCeSBkZWZhdWx0IHRoZSBjb21tYW5kIGlzIG5vdCBydW4gaWYgY2FwYWJpbGl0eSBpcyBhbHJlYWR5IGxpc3RlZC4gU2V0IHRvIHRydWUgdG8gc2tpcCB0aGlzIHZhbGlkYXRpb25cbiAgICovXG4gIGFzeW5jIHVwZ3JhZGVDb25uZWN0aW9uICgpIHtcbiAgICAvLyBza2lwIHJlcXVlc3QsIGlmIGFscmVhZHkgc2VjdXJlZFxuICAgIGlmICh0aGlzLmNsaWVudC5zZWN1cmVNb2RlKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICAvLyBza2lwIGlmIFNUQVJUVExTIG5vdCBhdmFpbGFibGUgb3Igc3RhcnR0bHMgc3VwcG9ydCBkaXNhYmxlZFxuICAgIGlmICgodGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdTVEFSVFRMUycpIDwgMCB8fCB0aGlzLl9pZ25vcmVUTFMpICYmICF0aGlzLl9yZXF1aXJlVExTKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnRW5jcnlwdGluZyBjb25uZWN0aW9uLi4uJylcbiAgICBhd2FpdCB0aGlzLmV4ZWMoJ1NUQVJUVExTJylcbiAgICB0aGlzLl9jYXBhYmlsaXR5ID0gW11cbiAgICB0aGlzLmNsaWVudC51cGdyYWRlKClcbiAgICByZXR1cm4gdGhpcy51cGRhdGVDYXBhYmlsaXR5KClcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIENBUEFCSUxJVFkgY29tbWFuZFxuICAgKlxuICAgKiBDQVBBQklMSVRZIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMS4xXG4gICAqXG4gICAqIERvZXNuJ3QgcmVnaXN0ZXIgdW50YWdnZWQgQ0FQQUJJTElUWSBoYW5kbGVyIGFzIHRoaXMgaXMgYWxyZWFkeVxuICAgKiBoYW5kbGVkIGJ5IGdsb2JhbCBoYW5kbGVyXG4gICAqXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2ZvcmNlZF0gQnkgZGVmYXVsdCB0aGUgY29tbWFuZCBpcyBub3QgcnVuIGlmIGNhcGFiaWxpdHkgaXMgYWxyZWFkeSBsaXN0ZWQuIFNldCB0byB0cnVlIHRvIHNraXAgdGhpcyB2YWxpZGF0aW9uXG4gICAqL1xuICBhc3luYyB1cGRhdGVDYXBhYmlsaXR5IChmb3JjZWQpIHtcbiAgICAvLyBza2lwIHJlcXVlc3QsIGlmIG5vdCBmb3JjZWQgdXBkYXRlIGFuZCBjYXBhYmlsaXRpZXMgYXJlIGFscmVhZHkgbG9hZGVkXG4gICAgaWYgKCFmb3JjZWQgJiYgdGhpcy5fY2FwYWJpbGl0eS5sZW5ndGgpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIElmIFNUQVJUVExTIGlzIHJlcXVpcmVkIHRoZW4gc2tpcCBjYXBhYmlsaXR5IGxpc3RpbmcgYXMgd2UgYXJlIGdvaW5nIHRvIHRyeVxuICAgIC8vIFNUQVJUVExTIGFueXdheSBhbmQgd2UgcmUtY2hlY2sgY2FwYWJpbGl0aWVzIGFmdGVyIGNvbm5lY3Rpb24gaXMgc2VjdXJlZFxuICAgIGlmICghdGhpcy5jbGllbnQuc2VjdXJlTW9kZSAmJiB0aGlzLl9yZXF1aXJlVExTKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnVXBkYXRpbmcgY2FwYWJpbGl0eS4uLicpXG4gICAgcmV0dXJuIHRoaXMuZXhlYygnQ0FQQUJJTElUWScpXG4gIH1cblxuICBoYXNDYXBhYmlsaXR5IChjYXBhID0gJycpIHtcbiAgICByZXR1cm4gdGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKGNhcGEudG9VcHBlckNhc2UoKS50cmltKCkpID49IDBcbiAgfVxuXG4gIC8vIERlZmF1bHQgaGFuZGxlcnMgZm9yIHVudGFnZ2VkIHJlc3BvbnNlc1xuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYW4gdW50YWdnZWQgT0sgaW5jbHVkZXMgW0NBUEFCSUxJVFldIHRhZyBhbmQgdXBkYXRlcyBjYXBhYmlsaXR5IG9iamVjdFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgUGFyc2VkIHNlcnZlciByZXNwb25zZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0IFVudGlsIGNhbGxlZCwgc2VydmVyIHJlc3BvbnNlcyBhcmUgbm90IHByb2Nlc3NlZFxuICAgKi9cbiAgX3VudGFnZ2VkT2tIYW5kbGVyIChyZXNwb25zZSkge1xuICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5jYXBhYmlsaXR5KSB7XG4gICAgICB0aGlzLl9jYXBhYmlsaXR5ID0gcmVzcG9uc2UuY2FwYWJpbGl0eVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIGNhcGFiaWxpdHkgb2JqZWN0XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSBQYXJzZWQgc2VydmVyIHJlc3BvbnNlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHQgVW50aWwgY2FsbGVkLCBzZXJ2ZXIgcmVzcG9uc2VzIGFyZSBub3QgcHJvY2Vzc2VkXG4gICAqL1xuICBfdW50YWdnZWRDYXBhYmlsaXR5SGFuZGxlciAocmVzcG9uc2UpIHtcbiAgICB0aGlzLl9jYXBhYmlsaXR5ID0gcGlwZShcbiAgICAgIHByb3BPcihbXSwgJ2F0dHJpYnV0ZXMnKSxcbiAgICAgIG1hcCgoeyB2YWx1ZSB9KSA9PiAodmFsdWUgfHwgJycpLnRvVXBwZXJDYXNlKCkudHJpbSgpKVxuICAgICkocmVzcG9uc2UpXG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBleGlzdGluZyBtZXNzYWdlIGNvdW50XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSBQYXJzZWQgc2VydmVyIHJlc3BvbnNlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHQgVW50aWwgY2FsbGVkLCBzZXJ2ZXIgcmVzcG9uc2VzIGFyZSBub3QgcHJvY2Vzc2VkXG4gICAqL1xuICBfdW50YWdnZWRFeGlzdHNIYW5kbGVyIChyZXNwb25zZSkge1xuICAgIGlmIChyZXNwb25zZSAmJiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocmVzcG9uc2UsICducicpKSB7XG4gICAgICB0aGlzLm9udXBkYXRlICYmIHRoaXMub251cGRhdGUodGhpcy5fc2VsZWN0ZWRNYWlsYm94LCAnZXhpc3RzJywgcmVzcG9uc2UubnIpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBhIG1lc3NhZ2UgaGFzIGJlZW4gZGVsZXRlZFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgUGFyc2VkIHNlcnZlciByZXNwb25zZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0IFVudGlsIGNhbGxlZCwgc2VydmVyIHJlc3BvbnNlcyBhcmUgbm90IHByb2Nlc3NlZFxuICAgKi9cbiAgX3VudGFnZ2VkRXhwdW5nZUhhbmRsZXIgKHJlc3BvbnNlKSB7XG4gICAgaWYgKHJlc3BvbnNlICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChyZXNwb25zZSwgJ25yJykpIHtcbiAgICAgIHRoaXMub251cGRhdGUgJiYgdGhpcy5vbnVwZGF0ZSh0aGlzLl9zZWxlY3RlZE1haWxib3gsICdleHB1bmdlJywgcmVzcG9uc2UubnIpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGF0IGZsYWdzIGhhdmUgYmVlbiB1cGRhdGVkIGZvciBhIG1lc3NhZ2VcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIFBhcnNlZCBzZXJ2ZXIgcmVzcG9uc2VcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dCBVbnRpbCBjYWxsZWQsIHNlcnZlciByZXNwb25zZXMgYXJlIG5vdCBwcm9jZXNzZWRcbiAgICovXG4gIF91bnRhZ2dlZEZldGNoSGFuZGxlciAocmVzcG9uc2UpIHtcbiAgICB0aGlzLm9udXBkYXRlICYmIHRoaXMub251cGRhdGUodGhpcy5fc2VsZWN0ZWRNYWlsYm94LCAnZmV0Y2gnLCBbXS5jb25jYXQocGFyc2VGRVRDSCh7IHBheWxvYWQ6IHsgRkVUQ0g6IFtyZXNwb25zZV0gfSB9KSB8fCBbXSkuc2hpZnQoKSlcbiAgfVxuXG4gIC8vIFByaXZhdGUgaGVscGVyc1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhhdCB0aGUgY29ubmVjdGlvbiBzdGFydGVkIGlkbGluZy4gSW5pdGlhdGVzIGEgY3ljbGVcbiAgICogb2YgTk9PUHMgb3IgSURMRXMgdG8gcmVjZWl2ZSBub3RpZmljYXRpb25zIGFib3V0IHVwZGF0ZXMgaW4gdGhlIHNlcnZlclxuICAgKi9cbiAgX29uSWRsZSAoKSB7XG4gICAgaWYgKCF0aGlzLl9hdXRoZW50aWNhdGVkIHx8IHRoaXMuX2VudGVyZWRJZGxlKSB7XG4gICAgICAvLyBObyBuZWVkIHRvIElETEUgd2hlbiBub3QgbG9nZ2VkIGluIG9yIGFscmVhZHkgaWRsaW5nXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnQ2xpZW50IHN0YXJ0ZWQgaWRsaW5nJylcbiAgICB0aGlzLmVudGVySWRsZSgpXG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgSU1BUCBzdGF0ZSB2YWx1ZSBmb3IgdGhlIGN1cnJlbnQgY29ubmVjdGlvblxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gbmV3U3RhdGUgVGhlIHN0YXRlIHlvdSB3YW50IHRvIGNoYW5nZSB0b1xuICAgKi9cbiAgX2NoYW5nZVN0YXRlIChuZXdTdGF0ZSkge1xuICAgIGlmIChuZXdTdGF0ZSA9PT0gdGhpcy5fc3RhdGUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdFbnRlcmluZyBzdGF0ZTogJyArIG5ld1N0YXRlKVxuXG4gICAgLy8gaWYgYSBtYWlsYm94IHdhcyBvcGVuZWQsIGVtaXQgb25jbG9zZW1haWxib3ggYW5kIGNsZWFyIHNlbGVjdGVkTWFpbGJveCB2YWx1ZVxuICAgIGlmICh0aGlzLl9zdGF0ZSA9PT0gU1RBVEVfU0VMRUNURUQgJiYgdGhpcy5fc2VsZWN0ZWRNYWlsYm94KSB7XG4gICAgICB0aGlzLm9uY2xvc2VtYWlsYm94ICYmIHRoaXMub25jbG9zZW1haWxib3godGhpcy5fc2VsZWN0ZWRNYWlsYm94KVxuICAgICAgdGhpcy5fc2VsZWN0ZWRNYWlsYm94ID0gZmFsc2VcbiAgICB9XG5cbiAgICB0aGlzLl9zdGF0ZSA9IG5ld1N0YXRlXG4gIH1cblxuICAvKipcbiAgICogRW5zdXJlcyBhIHBhdGggZXhpc3RzIGluIHRoZSBNYWlsYm94IHRyZWVcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHRyZWUgTWFpbGJveCB0cmVlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBkZWxpbWl0ZXJcbiAgICogQHJldHVybiB7T2JqZWN0fSBicmFuY2ggZm9yIHVzZWQgcGF0aFxuICAgKi9cbiAgX2Vuc3VyZVBhdGggKHRyZWUsIHBhdGgsIGRlbGltaXRlcikge1xuICAgIGNvbnN0IG5hbWVzID0gcGF0aC5zcGxpdChkZWxpbWl0ZXIpXG4gICAgbGV0IGJyYW5jaCA9IHRyZWVcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBmb3VuZCA9IGZhbHNlXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGJyYW5jaC5jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAodGhpcy5fY29tcGFyZU1haWxib3hOYW1lcyhicmFuY2guY2hpbGRyZW5bal0ubmFtZSwgaW1hcERlY29kZShuYW1lc1tpXSkpKSB7XG4gICAgICAgICAgYnJhbmNoID0gYnJhbmNoLmNoaWxkcmVuW2pdXG4gICAgICAgICAgZm91bmQgPSB0cnVlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICBicmFuY2guY2hpbGRyZW4ucHVzaCh7XG4gICAgICAgICAgbmFtZTogaW1hcERlY29kZShuYW1lc1tpXSksXG4gICAgICAgICAgZGVsaW1pdGVyOiBkZWxpbWl0ZXIsXG4gICAgICAgICAgcGF0aDogbmFtZXMuc2xpY2UoMCwgaSArIDEpLmpvaW4oZGVsaW1pdGVyKSxcbiAgICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgICAgfSlcbiAgICAgICAgYnJhbmNoID0gYnJhbmNoLmNoaWxkcmVuW2JyYW5jaC5jaGlsZHJlbi5sZW5ndGggLSAxXVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYnJhbmNoXG4gIH1cblxuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIG1haWxib3ggbmFtZXMuIENhc2UgaW5zZW5zaXRpdmUgaW4gY2FzZSBvZiBJTkJPWCwgb3RoZXJ3aXNlIGNhc2Ugc2Vuc2l0aXZlXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBhIE1haWxib3ggbmFtZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gYiBNYWlsYm94IG5hbWVcbiAgICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIGZvbGRlciBuYW1lcyBtYXRjaFxuICAgKi9cbiAgX2NvbXBhcmVNYWlsYm94TmFtZXMgKGEsIGIpIHtcbiAgICByZXR1cm4gKGEudG9VcHBlckNhc2UoKSA9PT0gJ0lOQk9YJyA/ICdJTkJPWCcgOiBhKSA9PT0gKGIudG9VcHBlckNhc2UoKSA9PT0gJ0lOQk9YJyA/ICdJTkJPWCcgOiBiKVxuICB9XG5cbiAgY3JlYXRlTG9nZ2VyIChjcmVhdG9yID0gY3JlYXRlRGVmYXVsdExvZ2dlcikge1xuICAgIGNvbnN0IGxvZ2dlciA9IGNyZWF0b3IoKHRoaXMuX2F1dGggfHwge30pLnVzZXIgfHwgJycsIHRoaXMuX2hvc3QpXG4gICAgdGhpcy5sb2dnZXIgPSB0aGlzLmNsaWVudC5sb2dnZXIgPSB7XG4gICAgICBkZWJ1ZzogKC4uLm1zZ3MpID0+IHsgaWYgKExPR19MRVZFTF9ERUJVRyA+PSB0aGlzLmxvZ0xldmVsKSB7IGxvZ2dlci5kZWJ1Zyhtc2dzKSB9IH0sXG4gICAgICBpbmZvOiAoLi4ubXNncykgPT4geyBpZiAoTE9HX0xFVkVMX0lORk8gPj0gdGhpcy5sb2dMZXZlbCkgeyBsb2dnZXIuaW5mbyhtc2dzKSB9IH0sXG4gICAgICB3YXJuOiAoLi4ubXNncykgPT4geyBpZiAoTE9HX0xFVkVMX1dBUk4gPj0gdGhpcy5sb2dMZXZlbCkgeyBsb2dnZXIud2Fybihtc2dzKSB9IH0sXG4gICAgICBlcnJvcjogKC4uLm1zZ3MpID0+IHsgaWYgKExPR19MRVZFTF9FUlJPUiA+PSB0aGlzLmxvZ0xldmVsKSB7IGxvZ2dlci5lcnJvcihtc2dzKSB9IH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==