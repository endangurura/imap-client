/* eslint-disable no-unused-expressions */
import ImapClient from './imap';
import { toTypedArray } from './common';
var host = 'localhost';
var port = 10000;
describe('browserbox imap unit tests', function () {
  var client, socketStub;
  /* jshint indent:false */

  beforeEach(function () {
    client = new ImapClient(host, port);
    expect(client).to.exist;
    client.logger = {
      debug: function debug() {},
      error: function error() {}
    };

    var Socket = function Socket() {};

    Socket.open = function () {};

    Socket.prototype.close = function () {};

    Socket.prototype.send = function () {};

    Socket.prototype.suspend = function () {};

    Socket.prototype.resume = function () {};

    Socket.prototype.upgradeToSecure = function () {};

    socketStub = sinon.createStubInstance(Socket);
    sinon.stub(Socket, 'open').withArgs(host, port).returns(socketStub);
    var promise = client.connect(Socket).then(function () {
      expect(Socket.open.callCount).to.equal(1);
      expect(socketStub.onerror).to.exist;
      expect(socketStub.onopen).to.exist;
      expect(socketStub.onclose).to.exist;
      expect(socketStub.ondata).to.exist;
    });
    setTimeout(function () {
      return socketStub.onopen();
    }, 10);
    return promise;
  });
  describe.skip('#close', function () {
    it('should call socket.close', function () {
      client.socket.readyState = 'open';
      setTimeout(function () {
        return socketStub.onclose();
      }, 10);
      return client.close().then(function () {
        expect(socketStub.close.callCount).to.equal(1);
      });
    });
    it('should not call socket.close', function () {
      client.socket.readyState = 'not open. duh.';
      setTimeout(function () {
        return socketStub.onclose();
      }, 10);
      return client.close().then(function () {
        expect(socketStub.close.called).to.be["false"];
      });
    });
  });
  describe('#upgrade', function () {
    it('should upgrade socket', function () {
      client.secureMode = false;
      client.upgrade();
    });
    it('should not upgrade socket', function () {
      client.secureMode = true;
      client.upgrade();
    });
  });
  describe('#setHandler', function () {
    it('should set global handler for keyword', function () {
      var handler = function handler() {};

      client.setHandler('fetch', handler);
      expect(client._globalAcceptUntagged.FETCH).to.equal(handler);
    });
  });
  describe('#socket.onerror', function () {
    it('should emit error and close connection', function (done) {
      client.socket.onerror({
        data: new Error('err')
      });

      client.onerror = function () {
        done();
      };
    });
  });
  describe('#socket.onclose', function () {
    it('should emit error ', function (done) {
      client.socket.onclose();

      client.onerror = function () {
        done();
      };
    });
  });
  describe('#_onData', function () {
    it('should process input', function () {
      sinon.stub(client, '_parseIncomingCommands');
      sinon.stub(client, '_iterateIncomingBuffer');

      client._onData({
        data: toTypedArray('foobar').buffer
      });

      expect(client._parseIncomingCommands.calledOnce).to.be["true"];
      expect(client._iterateIncomingBuffer.calledOnce).to.be["true"];
    });
  });
  describe('rateIncomingBuffer', function () {
    it('should iterate chunked input', function () {
      appendIncomingBuffer('* 1 FETCH (UID 1)\r\n* 2 FETCH (UID 2)\r\n* 3 FETCH (UID 3)\r\n');

      var iterator = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 1 FETCH (UID 1)');
      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 2 FETCH (UID 2)');
      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 3 FETCH (UID 3)');
      expect(iterator.next().value).to.be.undefined;
    });
    it('should process chunked literals', function () {
      appendIncomingBuffer('* 1 FETCH (UID {1}\r\n1)\r\n* 2 FETCH (UID {4}\r\n2345)\r\n* 3 FETCH (UID {4}\r\n3789)\r\n');

      var iterator = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 1 FETCH (UID {1}\r\n1)');
      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 2 FETCH (UID {4}\r\n2345)');
      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 3 FETCH (UID {4}\r\n3789)');
      expect(iterator.next().value).to.be.undefined;
    });
    it('should process chunked literals 2', function () {
      appendIncomingBuffer('* 1 FETCH (UID 1)\r\n* 2 FETCH (UID {4}\r\n2345)\r\n');

      var iterator = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 1 FETCH (UID 1)');
      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 2 FETCH (UID {4}\r\n2345)');
      expect(iterator.next().value).to.be.undefined;
    });
    it('should process chunked literals 3', function () {
      appendIncomingBuffer('* 1 FETCH (UID {1}\r\n1)\r\n* 2 FETCH (UID 4)\r\n');

      var iterator = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 1 FETCH (UID {1}\r\n1)');
      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 2 FETCH (UID 4)');
      expect(iterator.next().value).to.be.undefined;
    });
    it('should process chunked literals 4', function () {
      appendIncomingBuffer('* SEARCH {1}\r\n1 {1}\r\n2\r\n');

      var iterator = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* SEARCH {1}\r\n1 {1}\r\n2');
    });
    it('should process CRLF literal', function () {
      appendIncomingBuffer('* 1 FETCH (UID 20 BODY[HEADER.FIELDS (REFERENCES LIST-ID)] {2}\r\n\r\n)\r\n');

      var iterator = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 1 FETCH (UID 20 BODY[HEADER.FIELDS (REFERENCES LIST-ID)] {2}\r\n\r\n)');
    });
    it('should process CRLF literal 2', function () {
      appendIncomingBuffer('* 1 FETCH (UID 1 ENVELOPE ("string with {parenthesis}") BODY[HEADER.FIELDS (REFERENCES LIST-ID)] {2}\r\n\r\n)\r\n');

      var iterator = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 1 FETCH (UID 1 ENVELOPE ("string with {parenthesis}") BODY[HEADER.FIELDS (REFERENCES LIST-ID)] {2}\r\n\r\n)');
    });
    it('should parse multiple zero-length literals', function () {
      appendIncomingBuffer('* 126015 FETCH (UID 585599 BODY[1.2] {0}\r\n BODY[1.1] {0}\r\n)\r\n');

      var iterator = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 126015 FETCH (UID 585599 BODY[1.2] {0}\r\n BODY[1.1] {0}\r\n)');
    });
    it('should process two commands when CRLF arrives in 2 parts', function () {
      appendIncomingBuffer('* 1 FETCH (UID 1)\r');

      var iterator1 = client._iterateIncomingBuffer();

      expect(iterator1.next().value).to.be.undefined;
      appendIncomingBuffer('\n* 2 FETCH (UID 2)\r\n');

      var iterator2 = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator2.next().value)).to.equal('* 1 FETCH (UID 1)');
      expect(String.fromCharCode.apply(null, iterator2.next().value)).to.equal('* 2 FETCH (UID 2)');
      expect(iterator2.next().value).to.be.undefined;
    });
    it('should process literal when literal count arrives in 2 parts', function () {
      appendIncomingBuffer('* 1 FETCH (UID {');

      var iterator1 = client._iterateIncomingBuffer();

      expect(iterator1.next().value).to.be.undefined;
      appendIncomingBuffer('2}\r\n12)\r\n');

      var iterator2 = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator2.next().value)).to.equal('* 1 FETCH (UID {2}\r\n12)');
      expect(iterator2.next().value).to.be.undefined;
    });
    it('should process literal when literal count arrives in 2 parts 2', function () {
      appendIncomingBuffer('* 1 FETCH (UID {1');

      var iterator1 = client._iterateIncomingBuffer();

      expect(iterator1.next().value).to.be.undefined;
      appendIncomingBuffer('0}\r\n0123456789)\r\n');

      var iterator2 = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator2.next().value)).to.equal('* 1 FETCH (UID {10}\r\n0123456789)');
      expect(iterator2.next().value).to.be.undefined;
    });
    it('should process literal when literal count arrives in 2 parts 3', function () {
      appendIncomingBuffer('* 1 FETCH (UID {');

      var iterator1 = client._iterateIncomingBuffer();

      expect(iterator1.next().value).to.be.undefined;
      appendIncomingBuffer('10}\r\n1234567890)\r\n');

      var iterator2 = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator2.next().value)).to.equal('* 1 FETCH (UID {10}\r\n1234567890)');
      expect(iterator2.next().value).to.be.undefined;
    });
    it('should process literal when literal count arrives in 2 parts 4', function () {
      appendIncomingBuffer('* 1 FETCH (UID 1 BODY[HEADER.FIELDS (REFERENCES LIST-ID)] {2}\r');

      var iterator1 = client._iterateIncomingBuffer();

      expect(iterator1.next().value).to.be.undefined;
      appendIncomingBuffer('\nXX)\r\n');

      var iterator2 = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator2.next().value)).to.equal('* 1 FETCH (UID 1 BODY[HEADER.FIELDS (REFERENCES LIST-ID)] {2}\r\nXX)');
    });
    it('should process literal when literal count arrives in 3 parts', function () {
      appendIncomingBuffer('* 1 FETCH (UID {');

      var iterator1 = client._iterateIncomingBuffer();

      expect(iterator1.next().value).to.be.undefined;
      appendIncomingBuffer('1');

      var iterator2 = client._iterateIncomingBuffer();

      expect(iterator2.next().value).to.be.undefined;
      appendIncomingBuffer('}\r\n1)\r\n');

      var iterator3 = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator3.next().value)).to.equal('* 1 FETCH (UID {1}\r\n1)');
      expect(iterator3.next().value).to.be.undefined;
    });
    it('should process SEARCH response when it arrives in 2 parts', function () {
      appendIncomingBuffer('* SEARCH 1 2');

      var iterator1 = client._iterateIncomingBuffer();

      expect(iterator1.next().value).to.be.undefined;
      appendIncomingBuffer(' 3 4\r\n');

      var iterator2 = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator2.next().value)).to.equal('* SEARCH 1 2 3 4');
      expect(iterator2.next().value).to.be.undefined;
    });
    it('should not process {} in string as literal 1', function () {
      appendIncomingBuffer('* 1 FETCH (UID 1 ENVELOPE ("string with {parenthesis}"))\r\n');

      var iterator = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 1 FETCH (UID 1 ENVELOPE ("string with {parenthesis}"))');
    });
    it('should not process {} in string as literal 2', function () {
      appendIncomingBuffer('* 1 FETCH (UID 1 ENVELOPE ("string with number in parenthesis {123}"))\r\n');

      var iterator = client._iterateIncomingBuffer();

      expect(String.fromCharCode.apply(null, iterator.next().value)).to.equal('* 1 FETCH (UID 1 ENVELOPE ("string with number in parenthesis {123}"))');
    });

    function appendIncomingBuffer(content) {
      client._incomingBuffers.push(toTypedArray(content));
    }
  });
  describe('#_parseIncomingCommands', function () {
    it('should process a tagged item from the queue', function () {
      var _marked = /*#__PURE__*/regeneratorRuntime.mark(gen);

      client.onready = sinon.stub();
      sinon.stub(client, '_handleResponse');

      function gen() {
        return regeneratorRuntime.wrap(function gen$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return toTypedArray('OK Hello world!');

              case 2:
              case "end":
                return _context.stop();
            }
          }
        }, _marked);
      }

      client._parseIncomingCommands(gen());

      expect(client.onready.callCount).to.equal(1);
      expect(client._handleResponse.withArgs({
        tag: 'OK',
        command: 'Hello',
        attributes: [{
          type: 'ATOM',
          value: 'world!'
        }]
      }).calledOnce).to.be["true"];
    });
    it('should process an untagged item from the queue', function () {
      var _marked2 = /*#__PURE__*/regeneratorRuntime.mark(gen);

      sinon.stub(client, '_handleResponse');

      function gen() {
        return regeneratorRuntime.wrap(function gen$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return toTypedArray('* 1 EXISTS');

              case 2:
              case "end":
                return _context2.stop();
            }
          }
        }, _marked2);
      }

      client._parseIncomingCommands(gen());

      expect(client._handleResponse.withArgs({
        tag: '*',
        command: 'EXISTS',
        attributes: [],
        nr: 1
      }).calledOnce).to.be["true"];
    });
    it('should process a plus tagged item from the queue', function () {
      var _marked3 = /*#__PURE__*/regeneratorRuntime.mark(gen);

      sinon.stub(client, 'send');

      function gen() {
        return regeneratorRuntime.wrap(function gen$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return toTypedArray('+ Please continue');

              case 2:
              case "end":
                return _context3.stop();
            }
          }
        }, _marked3);
      }

      client._currentCommand = {
        data: ['literal data']
      };

      client._parseIncomingCommands(gen());

      expect(client.send.withArgs('literal data\r\n').callCount).to.equal(1);
    });
    it('should process an XOAUTH2 error challenge', function () {
      var _marked4 = /*#__PURE__*/regeneratorRuntime.mark(gen);

      sinon.stub(client, 'send');

      function gen() {
        return regeneratorRuntime.wrap(function gen$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return toTypedArray('+ FOOBAR');

              case 2:
              case "end":
                return _context4.stop();
            }
          }
        }, _marked4);
      }

      client._currentCommand = {
        data: [],
        errorResponseExpectsEmptyLine: true
      };

      client._parseIncomingCommands(gen());

      expect(client.send.withArgs('\r\n').callCount).to.equal(1);
    });
  });
  describe('#_handleResponse', function () {
    it('should invoke global handler by default', function () {
      sinon.stub(client, '_processResponse');
      sinon.stub(client, '_sendRequest');

      client._globalAcceptUntagged.TEST = function () {};

      sinon.stub(client._globalAcceptUntagged, 'TEST');
      client._currentCommand = false;

      client._handleResponse({
        tag: '*',
        command: 'test'
      });

      expect(client._sendRequest.callCount).to.equal(1);
      expect(client._globalAcceptUntagged.TEST.withArgs({
        tag: '*',
        command: 'test'
      }).callCount).to.equal(1);
    });
    it('should invoke global handler if needed', function () {
      sinon.stub(client, '_processResponse');

      client._globalAcceptUntagged.TEST = function () {};

      sinon.stub(client._globalAcceptUntagged, 'TEST');
      sinon.stub(client, '_sendRequest');
      client._currentCommand = {
        payload: {}
      };

      client._handleResponse({
        tag: '*',
        command: 'test'
      });

      expect(client._sendRequest.callCount).to.equal(0);
      expect(client._globalAcceptUntagged.TEST.withArgs({
        tag: '*',
        command: 'test'
      }).callCount).to.equal(1);
    });
    it('should push to payload', function () {
      sinon.stub(client, '_processResponse');

      client._globalAcceptUntagged.TEST = function () {};

      sinon.stub(client._globalAcceptUntagged, 'TEST');
      client._currentCommand = {
        payload: {
          TEST: []
        }
      };

      client._handleResponse({
        tag: '*',
        command: 'test'
      });

      expect(client._globalAcceptUntagged.TEST.callCount).to.equal(0);
      expect(client._currentCommand.payload.TEST).to.deep.equal([{
        tag: '*',
        command: 'test'
      }]);
    });
    it('should invoke command callback', function () {
      sinon.stub(client, '_processResponse');
      sinon.stub(client, '_sendRequest');

      client._globalAcceptUntagged.TEST = function () {};

      sinon.stub(client._globalAcceptUntagged, 'TEST');
      client._currentCommand = {
        tag: 'A',
        callback: function callback(response) {
          expect(response).to.deep.equal({
            tag: 'A',
            command: 'test',
            payload: {
              TEST: 'abc'
            }
          });
        },
        payload: {
          TEST: 'abc'
        }
      };

      client._handleResponse({
        tag: 'A',
        command: 'test'
      });

      expect(client._sendRequest.callCount).to.equal(1);
      expect(client._globalAcceptUntagged.TEST.callCount).to.equal(0);
    });
  });
  describe('#enqueueCommand', function () {
    it('should reject on NO/BAD', function () {
      sinon.stub(client, '_sendRequest').callsFake(function () {
        client._clientQueue[0].callback({
          command: 'NO'
        });
      });
      client._tagCounter = 100;
      client._clientQueue = [];
      client._canSend = true;
      return client.enqueueCommand({
        command: 'abc'
      }, ['def'], {
        t: 1
      })["catch"](function (err) {
        expect(err).to.exist;
      });
    });
    it('should invoke sending', function () {
      sinon.stub(client, '_sendRequest').callsFake(function () {
        client._clientQueue[0].callback({});
      });
      client._tagCounter = 100;
      client._clientQueue = [];
      client._canSend = true;
      return client.enqueueCommand({
        command: 'abc'
      }, ['def'], {
        t: 1
      }).then(function () {
        expect(client._sendRequest.callCount).to.equal(1);
        expect(client._clientQueue.length).to.equal(1);
        expect(client._clientQueue[0].tag).to.equal('W101');
        expect(client._clientQueue[0].request).to.deep.equal({
          command: 'abc',
          tag: 'W101'
        });
        expect(client._clientQueue[0].t).to.equal(1);
      });
    });
    it('should only queue', function () {
      sinon.stub(client, '_sendRequest');
      client._tagCounter = 100;
      client._clientQueue = [];
      client._canSend = false;
      setTimeout(function () {
        client._clientQueue[0].callback({});
      }, 0);
      return client.enqueueCommand({
        command: 'abc'
      }, ['def'], {
        t: 1
      }).then(function () {
        expect(client._sendRequest.callCount).to.equal(0);
        expect(client._clientQueue.length).to.equal(1);
        expect(client._clientQueue[0].tag).to.equal('W101');
      });
    });
    it('should store valueAsString option in the command', function () {
      sinon.stub(client, '_sendRequest');
      client._tagCounter = 100;
      client._clientQueue = [];
      client._canSend = false;
      setTimeout(function () {
        client._clientQueue[0].callback({});
      }, 0);
      return client.enqueueCommand({
        command: 'abc',
        valueAsString: false
      }, ['def'], {
        t: 1
      }).then(function () {
        expect(client._clientQueue[0].request.valueAsString).to.equal(false);
      });
    });
  });
  describe('#_sendRequest', function () {
    it('should enter idle if nothing is to process', function () {
      sinon.stub(client, '_enterIdle');
      client._clientQueue = [];

      client._sendRequest();

      expect(client._enterIdle.callCount).to.equal(1);
    });
    it('should send data', function () {
      sinon.stub(client, '_clearIdle');
      sinon.stub(client, 'send');
      client._clientQueue = [{
        request: {
          tag: 'W101',
          command: 'TEST'
        }
      }];

      client._sendRequest();

      expect(client._clearIdle.callCount).to.equal(1);
      expect(client.send.args[0][0]).to.equal('W101 TEST\r\n');
    });
    it('should send partial data', function () {
      sinon.stub(client, '_clearIdle');
      sinon.stub(client, 'send');
      client._clientQueue = [{
        request: {
          tag: 'W101',
          command: 'TEST',
          attributes: [{
            type: 'LITERAL',
            value: 'abc'
          }]
        }
      }];

      client._sendRequest();

      expect(client._clearIdle.callCount).to.equal(1);
      expect(client.send.args[0][0]).to.equal('W101 TEST {3}\r\n');
      expect(client._currentCommand.data).to.deep.equal(['abc']);
    });
    it('should run precheck', function (done) {
      sinon.stub(client, '_clearIdle');
      client._canSend = true;
      client._clientQueue = [{
        request: {
          tag: 'W101',
          command: 'TEST',
          attributes: [{
            type: 'LITERAL',
            value: 'abc'
          }]
        },
        precheck: function precheck(ctx) {
          expect(ctx).to.exist;
          expect(client._canSend).to.be["true"];

          client._sendRequest = function () {
            expect(client._clientQueue.length).to.equal(2);
            expect(client._clientQueue[0].tag).to.include('.p');
            expect(client._clientQueue[0].request.tag).to.include('.p');

            client._clearIdle.restore();

            done();
          };

          client.enqueueCommand({}, undefined, {
            ctx: ctx
          });
          return Promise.resolve();
        }
      }];

      client._sendRequest();
    });
  });
  describe('#_enterIdle', function () {
    it('should set idle timer', function (done) {
      client.onidle = function () {
        done();
      };

      client.timeoutEnterIdle = 1;

      client._enterIdle();
    });
  });
  describe('#_processResponse', function () {
    it('should set humanReadable', function () {
      var response = {
        tag: '*',
        command: 'OK',
        attributes: [{
          type: 'TEXT',
          value: 'Some random text'
        }]
      };

      client._processResponse(response);

      expect(response.humanReadable).to.equal('Some random text');
    });
    it('should set response code', function () {
      var response = {
        tag: '*',
        command: 'OK',
        attributes: [{
          type: 'ATOM',
          section: [{
            type: 'ATOM',
            value: 'CAPABILITY'
          }, {
            type: 'ATOM',
            value: 'IMAP4REV1'
          }, {
            type: 'ATOM',
            value: 'UIDPLUS'
          }]
        }, {
          type: 'TEXT',
          value: 'Some random text'
        }]
      };

      client._processResponse(response);

      expect(response.code).to.equal('CAPABILITY');
      expect(response.capability).to.deep.equal(['IMAP4REV1', 'UIDPLUS']);
    });
  });
  describe('#isError', function () {
    it('should detect if an object is an error', function () {
      expect(client.isError(new RangeError('abc'))).to.be["true"];
      expect(client.isError('abc')).to.be["false"];
    });
  });
  describe('#enableCompression', function () {
    it('should create inflater and deflater streams', function () {
      client.socket.ondata = function () {};

      sinon.stub(client.socket, 'ondata');
      expect(client.compressed).to.be["false"];
      client.enableCompression();
      expect(client.compressed).to.be["true"];
      var payload = 'asdasd';
      var expected = payload.split('').map(function (_char) {
        return _char.charCodeAt(0);
      });
      client.send(payload);
      var actualOut = socketStub.send.args[0][0];
      client.socket.ondata({
        data: actualOut
      });
      expect(Buffer.from(client._socketOnData.args[0][0].data)).to.deep.equal(Buffer.from(expected));
    });
  });
  describe('#getPreviouslyQueued', function () {
    var ctx = {};
    it('should return undefined with empty queue and no current command', function () {
      client._currentCommand = undefined;
      client._clientQueue = [];
      expect(testAndGetAttribute()).to.be.undefined;
    });
    it('should return undefined with empty queue and non-SELECT current command', function () {
      client._currentCommand = createCommand('TEST');
      client._clientQueue = [];
      expect(testAndGetAttribute()).to.be.undefined;
    });
    it('should return current command with empty queue and SELECT current command', function () {
      client._currentCommand = createCommand('SELECT', 'ATTR');
      client._clientQueue = [];
      expect(testAndGetAttribute()).to.equal('ATTR');
    });
    it('should return current command with non-SELECT commands in queue and SELECT current command', function () {
      client._currentCommand = createCommand('SELECT', 'ATTR');
      client._clientQueue = [createCommand('TEST01'), createCommand('TEST02')];
      expect(testAndGetAttribute()).to.equal('ATTR');
    });
    it('should return last SELECT before ctx with multiple SELECT commands in queue (1)', function () {
      client._currentCommand = createCommand('SELECT', 'ATTR01');
      client._clientQueue = [createCommand('SELECT', 'ATTR'), createCommand('TEST'), ctx, createCommand('SELECT', 'ATTR03')];
      expect(testAndGetAttribute()).to.equal('ATTR');
    });
    it('should return last SELECT before ctx with multiple SELECT commands in queue (2)', function () {
      client._clientQueue = [createCommand('SELECT', 'ATTR02'), createCommand('SELECT', 'ATTR'), ctx, createCommand('SELECT', 'ATTR03')];
      expect(testAndGetAttribute()).to.equal('ATTR');
    });
    it('should return last SELECT before ctx with multiple SELECT commands in queue (3)', function () {
      client._clientQueue = [createCommand('SELECT', 'ATTR02'), createCommand('SELECT', 'ATTR'), createCommand('TEST'), ctx, createCommand('SELECT', 'ATTR03')];
      expect(testAndGetAttribute()).to.equal('ATTR');
    });

    function testAndGetAttribute() {
      var data = client.getPreviouslyQueued(['SELECT'], ctx);

      if (data) {
        return data.request.attributes[0].value;
      }
    }

    function createCommand(command, attribute) {
      var attributes = [];
      var data = {
        request: {
          command: command,
          attributes: attributes
        }
      };

      if (attribute) {
        data.request.attributes.push({
          type: 'STRING',
          value: attribute
        });
      }

      return data;
    }
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbWFwLXVuaXQuanMiXSwibmFtZXMiOlsiSW1hcENsaWVudCIsInRvVHlwZWRBcnJheSIsImhvc3QiLCJwb3J0IiwiZGVzY3JpYmUiLCJjbGllbnQiLCJzb2NrZXRTdHViIiwiYmVmb3JlRWFjaCIsImV4cGVjdCIsInRvIiwiZXhpc3QiLCJsb2dnZXIiLCJkZWJ1ZyIsImVycm9yIiwiU29ja2V0Iiwib3BlbiIsInByb3RvdHlwZSIsImNsb3NlIiwic2VuZCIsInN1c3BlbmQiLCJyZXN1bWUiLCJ1cGdyYWRlVG9TZWN1cmUiLCJzaW5vbiIsImNyZWF0ZVN0dWJJbnN0YW5jZSIsInN0dWIiLCJ3aXRoQXJncyIsInJldHVybnMiLCJwcm9taXNlIiwiY29ubmVjdCIsInRoZW4iLCJjYWxsQ291bnQiLCJlcXVhbCIsIm9uZXJyb3IiLCJvbm9wZW4iLCJvbmNsb3NlIiwib25kYXRhIiwic2V0VGltZW91dCIsInNraXAiLCJpdCIsInNvY2tldCIsInJlYWR5U3RhdGUiLCJjYWxsZWQiLCJiZSIsInNlY3VyZU1vZGUiLCJ1cGdyYWRlIiwiaGFuZGxlciIsInNldEhhbmRsZXIiLCJfZ2xvYmFsQWNjZXB0VW50YWdnZWQiLCJGRVRDSCIsImRvbmUiLCJkYXRhIiwiRXJyb3IiLCJfb25EYXRhIiwiYnVmZmVyIiwiX3BhcnNlSW5jb21pbmdDb21tYW5kcyIsImNhbGxlZE9uY2UiLCJfaXRlcmF0ZUluY29taW5nQnVmZmVyIiwiYXBwZW5kSW5jb21pbmdCdWZmZXIiLCJpdGVyYXRvciIsIlN0cmluZyIsImZyb21DaGFyQ29kZSIsImFwcGx5IiwibmV4dCIsInZhbHVlIiwidW5kZWZpbmVkIiwiaXRlcmF0b3IxIiwiaXRlcmF0b3IyIiwiaXRlcmF0b3IzIiwiY29udGVudCIsIl9pbmNvbWluZ0J1ZmZlcnMiLCJwdXNoIiwiZ2VuIiwib25yZWFkeSIsIl9oYW5kbGVSZXNwb25zZSIsInRhZyIsImNvbW1hbmQiLCJhdHRyaWJ1dGVzIiwidHlwZSIsIm5yIiwiX2N1cnJlbnRDb21tYW5kIiwiZXJyb3JSZXNwb25zZUV4cGVjdHNFbXB0eUxpbmUiLCJURVNUIiwiX3NlbmRSZXF1ZXN0IiwicGF5bG9hZCIsImRlZXAiLCJjYWxsYmFjayIsInJlc3BvbnNlIiwiY2FsbHNGYWtlIiwiX2NsaWVudFF1ZXVlIiwiX3RhZ0NvdW50ZXIiLCJfY2FuU2VuZCIsImVucXVldWVDb21tYW5kIiwidCIsImVyciIsImxlbmd0aCIsInJlcXVlc3QiLCJ2YWx1ZUFzU3RyaW5nIiwiX2VudGVySWRsZSIsIl9jbGVhcklkbGUiLCJhcmdzIiwicHJlY2hlY2siLCJjdHgiLCJpbmNsdWRlIiwicmVzdG9yZSIsIlByb21pc2UiLCJyZXNvbHZlIiwib25pZGxlIiwidGltZW91dEVudGVySWRsZSIsIl9wcm9jZXNzUmVzcG9uc2UiLCJodW1hblJlYWRhYmxlIiwic2VjdGlvbiIsImNvZGUiLCJjYXBhYmlsaXR5IiwiaXNFcnJvciIsIlJhbmdlRXJyb3IiLCJjb21wcmVzc2VkIiwiZW5hYmxlQ29tcHJlc3Npb24iLCJleHBlY3RlZCIsInNwbGl0IiwibWFwIiwiY2hhciIsImNoYXJDb2RlQXQiLCJhY3R1YWxPdXQiLCJCdWZmZXIiLCJmcm9tIiwiX3NvY2tldE9uRGF0YSIsInRlc3RBbmRHZXRBdHRyaWJ1dGUiLCJjcmVhdGVDb21tYW5kIiwiZ2V0UHJldmlvdXNseVF1ZXVlZCIsImF0dHJpYnV0ZSJdLCJtYXBwaW5ncyI6IkFBQUE7QUFFQSxPQUFPQSxVQUFQLE1BQXVCLFFBQXZCO0FBQ0EsU0FBU0MsWUFBVCxRQUE2QixVQUE3QjtBQUVBLElBQU1DLElBQUksR0FBRyxXQUFiO0FBQ0EsSUFBTUMsSUFBSSxHQUFHLEtBQWI7QUFFQUMsUUFBUSxDQUFDLDRCQUFELEVBQStCLFlBQU07QUFDM0MsTUFBSUMsTUFBSixFQUFZQyxVQUFaO0FBRUE7O0FBRUFDLEVBQUFBLFVBQVUsQ0FBQyxZQUFNO0FBQ2ZGLElBQUFBLE1BQU0sR0FBRyxJQUFJTCxVQUFKLENBQWVFLElBQWYsRUFBcUJDLElBQXJCLENB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O0FBQ0Q7QUFDRixHQTNGTyxDQUFSO0FBNEZELENBaHdCTyxDQUFSIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLWV4cHJlc3Npb25zICovXG5cbmltcG9ydCBJbWFwQ2xpZW50IGZyb20gJy4vaW1hcCdcbmltcG9ydCB7IHRvVHlwZWRBcnJheSB9IGZyb20gJy4vY29tbW9uJ1xuXG5jb25zdCBob3N0ID0gJ2xvY2FsaG9zdCdcbmNvbnN0IHBvcnQgPSAxMDAwMFxuXG5kZXNjcmliZSgnYnJvd3NlcmJveCBpbWFwIHVuaXQgdGVzdHMnLCAoKSA9PiB7XG4gIHZhciBjbGllbnQsIHNvY2tldFN0dWJcblxuICAvKiBqc2hpbnQgaW5kZW50OmZhbHNlICovXG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgY2xpZW50ID0gbmV3IEltYXBDbGllbnQoaG9zdCwgcG9ydClcbiAgICBleHBlY3QoY2xpZW50KS50by5leGlzdFxuXG4gICAgY2xpZW50LmxvZ2dlciA9IHtcbiAgICAgIGRlYnVnOiAoKSA9PiB7IH0sXG4gICAgICBlcnJvcjogKCkgPT4geyB9XG4gICAgfVxuXG4gICAgdmFyIFNvY2tldCA9IGZ1bmN0aW9uICgpIHsgfVxuICAgIFNvY2tldC5vcGVuID0gKCkgPT4geyB9XG4gICAgU29ja2V0LnByb3RvdHlwZS5jbG9zZSA9ICgpID0+IHsgfVxuICAgIFNvY2tldC5wcm90b3R5cGUuc2VuZCA9ICgpID0+IHsgfVxuICAgIFNvY2tldC5wcm90b3R5cGUuc3VzcGVuZCA9ICgpID0+IHsgfVxuICAgIFNvY2tldC5wcm90b3R5cGUucmVzdW1lID0gKCkgPT4geyB9XG4gICAgU29ja2V0LnByb3RvdHlwZS51cGdyYWRlVG9TZWN1cmUgPSAoKSA9PiB7IH1cblxuICAgIHNvY2tldFN0dWIgPSBzaW5vbi5jcmVhdGVTdHViSW5zdGFuY2UoU29ja2V0KVxuICAgIHNpbm9uLnN0dWIoU29ja2V0LCAnb3BlbicpLndpdGhBcmdzKGhvc3QsIHBvcnQpLnJldHVybnMoc29ja2V0U3R1YilcblxuICAgIHZhciBwcm9taXNlID0gY2xpZW50LmNvbm5lY3QoU29ja2V0KS50aGVuKCgpID0+IHtcbiAgICAgIGV4cGVjdChTb2NrZXQub3Blbi5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG5cbiAgICAgIGV4cGVjdChzb2NrZXRTdHViLm9uZXJyb3IpLnRvLmV4aXN0XG4gICAgICBleHBlY3Qoc29ja2V0U3R1Yi5vbm9wZW4pLnRvLmV4aXN0XG4gICAgICBleHBlY3Qoc29ja2V0U3R1Yi5vbmNsb3NlKS50by5leGlzdFxuICAgICAgZXhwZWN0KHNvY2tldFN0dWIub25kYXRhKS50by5leGlzdFxuICAgIH0pXG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHNvY2tldFN0dWIub25vcGVuKCksIDEwKVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfSlcblxuICBkZXNjcmliZS5za2lwKCcjY2xvc2UnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNvY2tldC5jbG9zZScsICgpID0+IHtcbiAgICAgIGNsaWVudC5zb2NrZXQucmVhZHlTdGF0ZSA9ICdvcGVuJ1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHNvY2tldFN0dWIub25jbG9zZSgpLCAxMClcbiAgICAgIHJldHVybiBjbGllbnQuY2xvc2UoKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KHNvY2tldFN0dWIuY2xvc2UuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBub3QgY2FsbCBzb2NrZXQuY2xvc2UnLCAoKSA9PiB7XG4gICAgICBjbGllbnQuc29ja2V0LnJlYWR5U3RhdGUgPSAnbm90IG9wZW4uIGR1aC4nXG5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gc29ja2V0U3R1Yi5vbmNsb3NlKCksIDEwKVxuICAgICAgcmV0dXJuIGNsaWVudC5jbG9zZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3Qoc29ja2V0U3R1Yi5jbG9zZS5jYWxsZWQpLnRvLmJlLmZhbHNlXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyN1cGdyYWRlJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgdXBncmFkZSBzb2NrZXQnLCAoKSA9PiB7XG4gICAgICBjbGllbnQuc2VjdXJlTW9kZSA9IGZhbHNlXG4gICAgICBjbGllbnQudXBncmFkZSgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbm90IHVwZ3JhZGUgc29ja2V0JywgKCkgPT4ge1xuICAgICAgY2xpZW50LnNlY3VyZU1vZGUgPSB0cnVlXG4gICAgICBjbGllbnQudXBncmFkZSgpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI3NldEhhbmRsZXInLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzZXQgZ2xvYmFsIGhhbmRsZXIgZm9yIGtleXdvcmQnLCAoKSA9PiB7XG4gICAgICB2YXIgaGFuZGxlciA9ICgpID0+IHsgfVxuICAgICAgY2xpZW50LnNldEhhbmRsZXIoJ2ZldGNoJywgaGFuZGxlcilcblxuICAgICAgZXhwZWN0KGNsaWVudC5fZ2xvYmFsQWNjZXB0VW50YWdnZWQuRkVUQ0gpLnRvLmVxdWFsKGhhbmRsZXIpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI3NvY2tldC5vbmVycm9yJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZW1pdCBlcnJvciBhbmQgY2xvc2UgY29ubmVjdGlvbicsIChkb25lKSA9PiB7XG4gICAgICBjbGllbnQuc29ja2V0Lm9uZXJyb3Ioe1xuICAgICAgICBkYXRhOiBuZXcgRXJyb3IoJ2VycicpXG4gICAgICB9KVxuXG4gICAgICBjbGllbnQub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgZG9uZSgpXG4gICAgICB9XG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI3NvY2tldC5vbmNsb3NlJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZW1pdCBlcnJvciAnLCAoZG9uZSkgPT4ge1xuICAgICAgY2xpZW50LnNvY2tldC5vbmNsb3NlKClcblxuICAgICAgY2xpZW50Lm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgIGRvbmUoKVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNfb25EYXRhJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcHJvY2VzcyBpbnB1dCcsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoY2xpZW50LCAnX3BhcnNlSW5jb21pbmdDb21tYW5kcycpXG4gICAgICBzaW5vbi5zdHViKGNsaWVudCwgJ19pdGVyYXRlSW5jb21pbmdCdWZmZXInKVxuXG4gICAgICBjbGllbnQuX29uRGF0YSh7XG4gICAgICAgIGRhdGE6IHRvVHlwZWRBcnJheSgnZm9vYmFyJykuYnVmZmVyXG4gICAgICB9KVxuXG4gICAgICBleHBlY3QoY2xpZW50Ll9wYXJzZUluY29taW5nQ29tbWFuZHMuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgZXhwZWN0KGNsaWVudC5faXRlcmF0ZUluY29taW5nQnVmZmVyLmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdyYXRlSW5jb21pbmdCdWZmZXInLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBpdGVyYXRlIGNodW5rZWQgaW5wdXQnLCAoKSA9PiB7XG4gICAgICBhcHBlbmRJbmNvbWluZ0J1ZmZlcignKiAxIEZFVENIIChVSUQgMSlcXHJcXG4qIDIgRkVUQ0ggKFVJRCAyKVxcclxcbiogMyBGRVRDSCAoVUlEIDMpXFxyXFxuJylcbiAgICAgIHZhciBpdGVyYXRvciA9IGNsaWVudC5faXRlcmF0ZUluY29taW5nQnVmZmVyKClcblxuICAgICAgZXhwZWN0KFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgaXRlcmF0b3IubmV4dCgpLnZhbHVlKSkudG8uZXF1YWwoJyogMSBGRVRDSCAoVUlEIDEpJylcbiAgICAgIGV4cGVjdChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGl0ZXJhdG9yLm5leHQoKS52YWx1ZSkpLnRvLmVxdWFsKCcqIDIgRkVUQ0ggKFVJRCAyKScpXG4gICAgICBleHBlY3QoU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBpdGVyYXRvci5uZXh0KCkudmFsdWUpKS50by5lcXVhbCgnKiAzIEZFVENIIChVSUQgMyknKVxuICAgICAgZXhwZWN0KGl0ZXJhdG9yLm5leHQoKS52YWx1ZSkudG8uYmUudW5kZWZpbmVkXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJvY2VzcyBjaHVua2VkIGxpdGVyYWxzJywgKCkgPT4ge1xuICAgICAgYXBwZW5kSW5jb21pbmdCdWZmZXIoJyogMSBGRVRDSCAoVUlEIHsxfVxcclxcbjEpXFxyXFxuKiAyIEZFVENIIChVSUQgezR9XFxyXFxuMjM0NSlcXHJcXG4qIDMgRkVUQ0ggKFVJRCB7NH1cXHJcXG4zNzg5KVxcclxcbicpXG4gICAgICB2YXIgaXRlcmF0b3IgPSBjbGllbnQuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpXG5cbiAgICAgIGV4cGVjdChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGl0ZXJhdG9yLm5leHQoKS52YWx1ZSkpLnRvLmVxdWFsKCcqIDEgRkVUQ0ggKFVJRCB7MX1cXHJcXG4xKScpXG4gICAgICBleHBlY3QoU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBpdGVyYXRvci5uZXh0KCkudmFsdWUpKS50by5lcXVhbCgnKiAyIEZFVENIIChVSUQgezR9XFxyXFxuMjM0NSknKVxuICAgICAgZXhwZWN0KFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgaXRlcmF0b3IubmV4dCgpLnZhbHVlKSkudG8uZXF1YWwoJyogMyBGRVRDSCAoVUlEIHs0fVxcclxcbjM3ODkpJylcbiAgICAgIGV4cGVjdChpdGVyYXRvci5uZXh0KCkudmFsdWUpLnRvLmJlLnVuZGVmaW5lZFxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHByb2Nlc3MgY2h1bmtlZCBsaXRlcmFscyAyJywgKCkgPT4ge1xuICAgICAgYXBwZW5kSW5jb21pbmdCdWZmZXIoJyogMSBGRVRDSCAoVUlEIDEpXFxyXFxuKiAyIEZFVENIIChVSUQgezR9XFxyXFxuMjM0NSlcXHJcXG4nKVxuICAgICAgdmFyIGl0ZXJhdG9yID0gY2xpZW50Ll9pdGVyYXRlSW5jb21pbmdCdWZmZXIoKVxuXG4gICAgICBleHBlY3QoU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBpdGVyYXRvci5uZXh0KCkudmFsdWUpKS50by5lcXVhbCgnKiAxIEZFVENIIChVSUQgMSknKVxuICAgICAgZXhwZWN0KFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgaXRlcmF0b3IubmV4dCgpLnZhbHVlKSkudG8uZXF1YWwoJyogMiBGRVRDSCAoVUlEIHs0fVxcclxcbjIzNDUpJylcbiAgICAgIGV4cGVjdChpdGVyYXRvci5uZXh0KCkudmFsdWUpLnRvLmJlLnVuZGVmaW5lZFxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHByb2Nlc3MgY2h1bmtlZCBsaXRlcmFscyAzJywgKCkgPT4ge1xuICAgICAgYXBwZW5kSW5jb21pbmdCdWZmZXIoJyogMSBGRVRDSCAoVUlEIHsxfVxcclxcbjEpXFxyXFxuKiAyIEZFVENIIChVSUQgNClcXHJcXG4nKVxuICAgICAgdmFyIGl0ZXJhdG9yID0gY2xpZW50Ll9pdGVyYXRlSW5jb21pbmdCdWZmZXIoKVxuXG4gICAgICBleHBlY3QoU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBpdGVyYXRvci5uZXh0KCkudmFsdWUpKS50by5lcXVhbCgnKiAxIEZFVENIIChVSUQgezF9XFxyXFxuMSknKVxuICAgICAgZXhwZWN0KFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgaXRlcmF0b3IubmV4dCgpLnZhbHVlKSkudG8uZXF1YWwoJyogMiBGRVRDSCAoVUlEIDQpJylcbiAgICAgIGV4cGVjdChpdGVyYXRvci5uZXh0KCkudmFsdWUpLnRvLmJlLnVuZGVmaW5lZFxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHByb2Nlc3MgY2h1bmtlZCBsaXRlcmFscyA0JywgKCkgPT4ge1xuICAgICAgYXBwZW5kSW5jb21pbmdCdWZmZXIoJyogU0VBUkNIIHsxfVxcclxcbjEgezF9XFxyXFxuMlxcclxcbicpXG4gICAgICB2YXIgaXRlcmF0b3IgPSBjbGllbnQuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpXG4gICAgICBleHBlY3QoU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBpdGVyYXRvci5uZXh0KCkudmFsdWUpKS50by5lcXVhbCgnKiBTRUFSQ0ggezF9XFxyXFxuMSB7MX1cXHJcXG4yJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwcm9jZXNzIENSTEYgbGl0ZXJhbCcsICgpID0+IHtcbiAgICAgIGFwcGVuZEluY29taW5nQnVmZmVyKCcqIDEgRkVUQ0ggKFVJRCAyMCBCT0RZW0hFQURFUi5GSUVMRFMgKFJFRkVSRU5DRVMgTElTVC1JRCldIHsyfVxcclxcblxcclxcbilcXHJcXG4nKVxuICAgICAgdmFyIGl0ZXJhdG9yID0gY2xpZW50Ll9pdGVyYXRlSW5jb21pbmdCdWZmZXIoKVxuICAgICAgZXhwZWN0KFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgaXRlcmF0b3IubmV4dCgpLnZhbHVlKSkudG8uZXF1YWwoJyogMSBGRVRDSCAoVUlEIDIwIEJPRFlbSEVBREVSLkZJRUxEUyAoUkVGRVJFTkNFUyBMSVNULUlEKV0gezJ9XFxyXFxuXFxyXFxuKScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJvY2VzcyBDUkxGIGxpdGVyYWwgMicsICgpID0+IHtcbiAgICAgIGFwcGVuZEluY29taW5nQnVmZmVyKCcqIDEgRkVUQ0ggKFVJRCAxIEVOVkVMT1BFIChcInN0cmluZyB3aXRoIHtwYXJlbnRoZXNpc31cIikgQk9EWVtIRUFERVIuRklFTERTIChSRUZFUkVOQ0VTIExJU1QtSUQpXSB7Mn1cXHJcXG5cXHJcXG4pXFxyXFxuJylcbiAgICAgIHZhciBpdGVyYXRvciA9IGNsaWVudC5faXRlcmF0ZUluY29taW5nQnVmZmVyKClcbiAgICAgIGV4cGVjdChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGl0ZXJhdG9yLm5leHQoKS52YWx1ZSkpLnRvLmVxdWFsKCcqIDEgRkVUQ0ggKFVJRCAxIEVOVkVMT1BFIChcInN0cmluZyB3aXRoIHtwYXJlbnRoZXNpc31cIikgQk9EWVtIRUFERVIuRklFTERTIChSRUZFUkVOQ0VTIExJU1QtSUQpXSB7Mn1cXHJcXG5cXHJcXG4pJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwYXJzZSBtdWx0aXBsZSB6ZXJvLWxlbmd0aCBsaXRlcmFscycsICgpID0+IHtcbiAgICAgIGFwcGVuZEluY29taW5nQnVmZmVyKCcqIDEyNjAxNSBGRVRDSCAoVUlEIDU4NTU5OSBCT0RZWzEuMl0gezB9XFxyXFxuIEJPRFlbMS4xXSB7MH1cXHJcXG4pXFxyXFxuJylcbiAgICAgIHZhciBpdGVyYXRvciA9IGNsaWVudC5faXRlcmF0ZUluY29taW5nQnVmZmVyKClcbiAgICAgIGV4cGVjdChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGl0ZXJhdG9yLm5leHQoKS52YWx1ZSkpLnRvLmVxdWFsKCcqIDEyNjAxNSBGRVRDSCAoVUlEIDU4NTU5OSBCT0RZWzEuMl0gezB9XFxyXFxuIEJPRFlbMS4xXSB7MH1cXHJcXG4pJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwcm9jZXNzIHR3byBjb21tYW5kcyB3aGVuIENSTEYgYXJyaXZlcyBpbiAyIHBhcnRzJywgKCkgPT4ge1xuICAgICAgYXBwZW5kSW5jb21pbmdCdWZmZXIoJyogMSBGRVRDSCAoVUlEIDEpXFxyJylcbiAgICAgIHZhciBpdGVyYXRvcjEgPSBjbGllbnQuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpXG4gICAgICBleHBlY3QoaXRlcmF0b3IxLm5leHQoKS52YWx1ZSkudG8uYmUudW5kZWZpbmVkXG5cbiAgICAgIGFwcGVuZEluY29taW5nQnVmZmVyKCdcXG4qIDIgRkVUQ0ggKFVJRCAyKVxcclxcbicpXG4gICAgICB2YXIgaXRlcmF0b3IyID0gY2xpZW50Ll9pdGVyYXRlSW5jb21pbmdCdWZmZXIoKVxuICAgICAgZXhwZWN0KFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgaXRlcmF0b3IyLm5leHQoKS52YWx1ZSkpLnRvLmVxdWFsKCcqIDEgRkVUQ0ggKFVJRCAxKScpXG4gICAgICBleHBlY3QoU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBpdGVyYXRvcjIubmV4dCgpLnZhbHVlKSkudG8uZXF1YWwoJyogMiBGRVRDSCAoVUlEIDIpJylcbiAgICAgIGV4cGVjdChpdGVyYXRvcjIubmV4dCgpLnZhbHVlKS50by5iZS51bmRlZmluZWRcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwcm9jZXNzIGxpdGVyYWwgd2hlbiBsaXRlcmFsIGNvdW50IGFycml2ZXMgaW4gMiBwYXJ0cycsICgpID0+IHtcbiAgICAgIGFwcGVuZEluY29taW5nQnVmZmVyKCcqIDEgRkVUQ0ggKFVJRCB7JylcbiAgICAgIHZhciBpdGVyYXRvcjEgPSBjbGllbnQuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpXG4gICAgICBleHBlY3QoaXRlcmF0b3IxLm5leHQoKS52YWx1ZSkudG8uYmUudW5kZWZpbmVkXG5cbiAgICAgIGFwcGVuZEluY29taW5nQnVmZmVyKCcyfVxcclxcbjEyKVxcclxcbicpXG4gICAgICB2YXIgaXRlcmF0b3IyID0gY2xpZW50Ll9pdGVyYXRlSW5jb21pbmdCdWZmZXIoKVxuICAgICAgZXhwZWN0KFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgaXRlcmF0b3IyLm5leHQoKS52YWx1ZSkpLnRvLmVxdWFsKCcqIDEgRkVUQ0ggKFVJRCB7Mn1cXHJcXG4xMiknKVxuICAgICAgZXhwZWN0KGl0ZXJhdG9yMi5uZXh0KCkudmFsdWUpLnRvLmJlLnVuZGVmaW5lZFxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHByb2Nlc3MgbGl0ZXJhbCB3aGVuIGxpdGVyYWwgY291bnQgYXJyaXZlcyBpbiAyIHBhcnRzIDInLCAoKSA9PiB7XG4gICAgICBhcHBlbmRJbmNvbWluZ0J1ZmZlcignKiAxIEZFVENIIChVSUQgezEnKVxuICAgICAgdmFyIGl0ZXJhdG9yMSA9IGNsaWVudC5faXRlcmF0ZUluY29taW5nQnVmZmVyKClcbiAgICAgIGV4cGVjdChpdGVyYXRvcjEubmV4dCgpLnZhbHVlKS50by5iZS51bmRlZmluZWRcblxuICAgICAgYXBwZW5kSW5jb21pbmdCdWZmZXIoJzB9XFxyXFxuMDEyMzQ1Njc4OSlcXHJcXG4nKVxuICAgICAgdmFyIGl0ZXJhdG9yMiA9IGNsaWVudC5faXRlcmF0ZUluY29taW5nQnVmZmVyKClcbiAgICAgIGV4cGVjdChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGl0ZXJhdG9yMi5uZXh0KCkudmFsdWUpKS50by5lcXVhbCgnKiAxIEZFVENIIChVSUQgezEwfVxcclxcbjAxMjM0NTY3ODkpJylcbiAgICAgIGV4cGVjdChpdGVyYXRvcjIubmV4dCgpLnZhbHVlKS50by5iZS51bmRlZmluZWRcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwcm9jZXNzIGxpdGVyYWwgd2hlbiBsaXRlcmFsIGNvdW50IGFycml2ZXMgaW4gMiBwYXJ0cyAzJywgKCkgPT4ge1xuICAgICAgYXBwZW5kSW5jb21pbmdCdWZmZXIoJyogMSBGRVRDSCAoVUlEIHsnKVxuICAgICAgdmFyIGl0ZXJhdG9yMSA9IGNsaWVudC5faXRlcmF0ZUluY29taW5nQnVmZmVyKClcbiAgICAgIGV4cGVjdChpdGVyYXRvcjEubmV4dCgpLnZhbHVlKS50by5iZS51bmRlZmluZWRcblxuICAgICAgYXBwZW5kSW5jb21pbmdCdWZmZXIoJzEwfVxcclxcbjEyMzQ1Njc4OTApXFxyXFxuJylcbiAgICAgIHZhciBpdGVyYXRvcjIgPSBjbGllbnQuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpXG4gICAgICBleHBlY3QoU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBpdGVyYXRvcjIubmV4dCgpLnZhbHVlKSkudG8uZXF1YWwoJyogMSBGRVRDSCAoVUlEIHsxMH1cXHJcXG4xMjM0NTY3ODkwKScpXG4gICAgICBleHBlY3QoaXRlcmF0b3IyLm5leHQoKS52YWx1ZSkudG8uYmUudW5kZWZpbmVkXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJvY2VzcyBsaXRlcmFsIHdoZW4gbGl0ZXJhbCBjb3VudCBhcnJpdmVzIGluIDIgcGFydHMgNCcsICgpID0+IHtcbiAgICAgIGFwcGVuZEluY29taW5nQnVmZmVyKCcqIDEgRkVUQ0ggKFVJRCAxIEJPRFlbSEVBREVSLkZJRUxEUyAoUkVGRVJFTkNFUyBMSVNULUlEKV0gezJ9XFxyJylcbiAgICAgIHZhciBpdGVyYXRvcjEgPSBjbGllbnQuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpXG4gICAgICBleHBlY3QoaXRlcmF0b3IxLm5leHQoKS52YWx1ZSkudG8uYmUudW5kZWZpbmVkXG4gICAgICBhcHBlbmRJbmNvbWluZ0J1ZmZlcignXFxuWFgpXFxyXFxuJylcbiAgICAgIHZhciBpdGVyYXRvcjIgPSBjbGllbnQuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpXG4gICAgICBleHBlY3QoU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBpdGVyYXRvcjIubmV4dCgpLnZhbHVlKSkudG8uZXF1YWwoJyogMSBGRVRDSCAoVUlEIDEgQk9EWVtIRUFERVIuRklFTERTIChSRUZFUkVOQ0VTIExJU1QtSUQpXSB7Mn1cXHJcXG5YWCknKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHByb2Nlc3MgbGl0ZXJhbCB3aGVuIGxpdGVyYWwgY291bnQgYXJyaXZlcyBpbiAzIHBhcnRzJywgKCkgPT4ge1xuICAgICAgYXBwZW5kSW5jb21pbmdCdWZmZXIoJyogMSBGRVRDSCAoVUlEIHsnKVxuICAgICAgdmFyIGl0ZXJhdG9yMSA9IGNsaWVudC5faXRlcmF0ZUluY29taW5nQnVmZmVyKClcbiAgICAgIGV4cGVjdChpdGVyYXRvcjEubmV4dCgpLnZhbHVlKS50by5iZS51bmRlZmluZWRcblxuICAgICAgYXBwZW5kSW5jb21pbmdCdWZmZXIoJzEnKVxuICAgICAgdmFyIGl0ZXJhdG9yMiA9IGNsaWVudC5faXRlcmF0ZUluY29taW5nQnVmZmVyKClcbiAgICAgIGV4cGVjdChpdGVyYXRvcjIubmV4dCgpLnZhbHVlKS50by5iZS51bmRlZmluZWRcblxuICAgICAgYXBwZW5kSW5jb21pbmdCdWZmZXIoJ31cXHJcXG4xKVxcclxcbicpXG4gICAgICB2YXIgaXRlcmF0b3IzID0gY2xpZW50Ll9pdGVyYXRlSW5jb21pbmdCdWZmZXIoKVxuICAgICAgZXhwZWN0KFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgaXRlcmF0b3IzLm5leHQoKS52YWx1ZSkpLnRvLmVxdWFsKCcqIDEgRkVUQ0ggKFVJRCB7MX1cXHJcXG4xKScpXG4gICAgICBleHBlY3QoaXRlcmF0b3IzLm5leHQoKS52YWx1ZSkudG8uYmUudW5kZWZpbmVkXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJvY2VzcyBTRUFSQ0ggcmVzcG9uc2Ugd2hlbiBpdCBhcnJpdmVzIGluIDIgcGFydHMnLCAoKSA9PiB7XG4gICAgICBhcHBlbmRJbmNvbWluZ0J1ZmZlcignKiBTRUFSQ0ggMSAyJylcbiAgICAgIHZhciBpdGVyYXRvcjEgPSBjbGllbnQuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpXG4gICAgICBleHBlY3QoaXRlcmF0b3IxLm5leHQoKS52YWx1ZSkudG8uYmUudW5kZWZpbmVkXG5cbiAgICAgIGFwcGVuZEluY29taW5nQnVmZmVyKCcgMyA0XFxyXFxuJylcbiAgICAgIHZhciBpdGVyYXRvcjIgPSBjbGllbnQuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpXG4gICAgICBleHBlY3QoU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBpdGVyYXRvcjIubmV4dCgpLnZhbHVlKSkudG8uZXF1YWwoJyogU0VBUkNIIDEgMiAzIDQnKVxuICAgICAgZXhwZWN0KGl0ZXJhdG9yMi5uZXh0KCkudmFsdWUpLnRvLmJlLnVuZGVmaW5lZFxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG5vdCBwcm9jZXNzIHt9IGluIHN0cmluZyBhcyBsaXRlcmFsIDEnLCAoKSA9PiB7XG4gICAgICBhcHBlbmRJbmNvbWluZ0J1ZmZlcignKiAxIEZFVENIIChVSUQgMSBFTlZFTE9QRSAoXCJzdHJpbmcgd2l0aCB7cGFyZW50aGVzaXN9XCIpKVxcclxcbicpXG4gICAgICB2YXIgaXRlcmF0b3IgPSBjbGllbnQuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpXG4gICAgICBleHBlY3QoU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBpdGVyYXRvci5uZXh0KCkudmFsdWUpKS50by5lcXVhbCgnKiAxIEZFVENIIChVSUQgMSBFTlZFTE9QRSAoXCJzdHJpbmcgd2l0aCB7cGFyZW50aGVzaXN9XCIpKScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbm90IHByb2Nlc3Mge30gaW4gc3RyaW5nIGFzIGxpdGVyYWwgMicsICgpID0+IHtcbiAgICAgIGFwcGVuZEluY29taW5nQnVmZmVyKCcqIDEgRkVUQ0ggKFVJRCAxIEVOVkVMT1BFIChcInN0cmluZyB3aXRoIG51bWJlciBpbiBwYXJlbnRoZXNpcyB7MTIzfVwiKSlcXHJcXG4nKVxuICAgICAgdmFyIGl0ZXJhdG9yID0gY2xpZW50Ll9pdGVyYXRlSW5jb21pbmdCdWZmZXIoKVxuICAgICAgZXhwZWN0KFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgaXRlcmF0b3IubmV4dCgpLnZhbHVlKSkudG8uZXF1YWwoJyogMSBGRVRDSCAoVUlEIDEgRU5WRUxPUEUgKFwic3RyaW5nIHdpdGggbnVtYmVyIGluIHBhcmVudGhlc2lzIHsxMjN9XCIpKScpXG4gICAgfSlcblxuICAgIGZ1bmN0aW9uIGFwcGVuZEluY29taW5nQnVmZmVyIChjb250ZW50KSB7XG4gICAgICBjbGllbnQuX2luY29taW5nQnVmZmVycy5wdXNoKHRvVHlwZWRBcnJheShjb250ZW50KSlcbiAgICB9XG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNfcGFyc2VJbmNvbWluZ0NvbW1hbmRzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcHJvY2VzcyBhIHRhZ2dlZCBpdGVtIGZyb20gdGhlIHF1ZXVlJywgKCkgPT4ge1xuICAgICAgY2xpZW50Lm9ucmVhZHkgPSBzaW5vbi5zdHViKClcbiAgICAgIHNpbm9uLnN0dWIoY2xpZW50LCAnX2hhbmRsZVJlc3BvbnNlJylcblxuICAgICAgZnVuY3Rpb24gKiBnZW4gKCkgeyB5aWVsZCB0b1R5cGVkQXJyYXkoJ09LIEhlbGxvIHdvcmxkIScpIH1cblxuICAgICAgY2xpZW50Ll9wYXJzZUluY29taW5nQ29tbWFuZHMoZ2VuKCkpXG5cbiAgICAgIGV4cGVjdChjbGllbnQub25yZWFkeS5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICBleHBlY3QoY2xpZW50Ll9oYW5kbGVSZXNwb25zZS53aXRoQXJncyh7XG4gICAgICAgIHRhZzogJ09LJyxcbiAgICAgICAgY29tbWFuZDogJ0hlbGxvJyxcbiAgICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgICB0eXBlOiAnQVRPTScsXG4gICAgICAgICAgdmFsdWU6ICd3b3JsZCEnXG4gICAgICAgIH1dXG4gICAgICB9KS5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJvY2VzcyBhbiB1bnRhZ2dlZCBpdGVtIGZyb20gdGhlIHF1ZXVlJywgKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihjbGllbnQsICdfaGFuZGxlUmVzcG9uc2UnKVxuXG4gICAgICBmdW5jdGlvbiAqIGdlbiAoKSB7IHlpZWxkIHRvVHlwZWRBcnJheSgnKiAxIEVYSVNUUycpIH1cblxuICAgICAgY2xpZW50Ll9wYXJzZUluY29taW5nQ29tbWFuZHMoZ2VuKCkpXG5cbiAgICAgIGV4cGVjdChjbGllbnQuX2hhbmRsZVJlc3BvbnNlLndpdGhBcmdzKHtcbiAgICAgICAgdGFnOiAnKicsXG4gICAgICAgIGNvbW1hbmQ6ICdFWElTVFMnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbXSxcbiAgICAgICAgbnI6IDFcbiAgICAgIH0pLmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwcm9jZXNzIGEgcGx1cyB0YWdnZWQgaXRlbSBmcm9tIHRoZSBxdWV1ZScsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoY2xpZW50LCAnc2VuZCcpXG5cbiAgICAgIGZ1bmN0aW9uICogZ2VuICgpIHsgeWllbGQgdG9UeXBlZEFycmF5KCcrIFBsZWFzZSBjb250aW51ZScpIH1cbiAgICAgIGNsaWVudC5fY3VycmVudENvbW1hbmQgPSB7XG4gICAgICAgIGRhdGE6IFsnbGl0ZXJhbCBkYXRhJ11cbiAgICAgIH1cblxuICAgICAgY2xpZW50Ll9wYXJzZUluY29taW5nQ29tbWFuZHMoZ2VuKCkpXG5cbiAgICAgIGV4cGVjdChjbGllbnQuc2VuZC53aXRoQXJncygnbGl0ZXJhbCBkYXRhXFxyXFxuJykuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHByb2Nlc3MgYW4gWE9BVVRIMiBlcnJvciBjaGFsbGVuZ2UnLCAoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGNsaWVudCwgJ3NlbmQnKVxuXG4gICAgICBmdW5jdGlvbiAqIGdlbiAoKSB7IHlpZWxkIHRvVHlwZWRBcnJheSgnKyBGT09CQVInKSB9XG4gICAgICBjbGllbnQuX2N1cnJlbnRDb21tYW5kID0ge1xuICAgICAgICBkYXRhOiBbXSxcbiAgICAgICAgZXJyb3JSZXNwb25zZUV4cGVjdHNFbXB0eUxpbmU6IHRydWVcbiAgICAgIH1cblxuICAgICAgY2xpZW50Ll9wYXJzZUluY29taW5nQ29tbWFuZHMoZ2VuKCkpXG5cbiAgICAgIGV4cGVjdChjbGllbnQuc2VuZC53aXRoQXJncygnXFxyXFxuJykuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNfaGFuZGxlUmVzcG9uc2UnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBpbnZva2UgZ2xvYmFsIGhhbmRsZXIgYnkgZGVmYXVsdCcsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoY2xpZW50LCAnX3Byb2Nlc3NSZXNwb25zZScpXG4gICAgICBzaW5vbi5zdHViKGNsaWVudCwgJ19zZW5kUmVxdWVzdCcpXG5cbiAgICAgIGNsaWVudC5fZ2xvYmFsQWNjZXB0VW50YWdnZWQuVEVTVCA9ICgpID0+IHsgfVxuICAgICAgc2lub24uc3R1YihjbGllbnQuX2dsb2JhbEFjY2VwdFVudGFnZ2VkLCAnVEVTVCcpXG5cbiAgICAgIGNsaWVudC5fY3VycmVudENvbW1hbmQgPSBmYWxzZVxuICAgICAgY2xpZW50Ll9oYW5kbGVSZXNwb25zZSh7XG4gICAgICAgIHRhZzogJyonLFxuICAgICAgICBjb21tYW5kOiAndGVzdCdcbiAgICAgIH0pXG5cbiAgICAgIGV4cGVjdChjbGllbnQuX3NlbmRSZXF1ZXN0LmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIGV4cGVjdChjbGllbnQuX2dsb2JhbEFjY2VwdFVudGFnZ2VkLlRFU1Qud2l0aEFyZ3Moe1xuICAgICAgICB0YWc6ICcqJyxcbiAgICAgICAgY29tbWFuZDogJ3Rlc3QnXG4gICAgICB9KS5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW52b2tlIGdsb2JhbCBoYW5kbGVyIGlmIG5lZWRlZCcsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoY2xpZW50LCAnX3Byb2Nlc3NSZXNwb25zZScpXG4gICAgICBjbGllbnQuX2dsb2JhbEFjY2VwdFVudGFnZ2VkLlRFU1QgPSAoKSA9PiB7IH1cbiAgICAgIHNpbm9uLnN0dWIoY2xpZW50Ll9nbG9iYWxBY2NlcHRVbnRhZ2dlZCwgJ1RFU1QnKVxuICAgICAgc2lub24uc3R1YihjbGllbnQsICdfc2VuZFJlcXVlc3QnKVxuXG4gICAgICBjbGllbnQuX2N1cnJlbnRDb21tYW5kID0ge1xuICAgICAgICBwYXlsb2FkOiB7fVxuICAgICAgfVxuICAgICAgY2xpZW50Ll9oYW5kbGVSZXNwb25zZSh7XG4gICAgICAgIHRhZzogJyonLFxuICAgICAgICBjb21tYW5kOiAndGVzdCdcbiAgICAgIH0pXG5cbiAgICAgIGV4cGVjdChjbGllbnQuX3NlbmRSZXF1ZXN0LmNhbGxDb3VudCkudG8uZXF1YWwoMClcbiAgICAgIGV4cGVjdChjbGllbnQuX2dsb2JhbEFjY2VwdFVudGFnZ2VkLlRFU1Qud2l0aEFyZ3Moe1xuICAgICAgICB0YWc6ICcqJyxcbiAgICAgICAgY29tbWFuZDogJ3Rlc3QnXG4gICAgICB9KS5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHVzaCB0byBwYXlsb2FkJywgKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihjbGllbnQsICdfcHJvY2Vzc1Jlc3BvbnNlJylcbiAgICAgIGNsaWVudC5fZ2xvYmFsQWNjZXB0VW50YWdnZWQuVEVTVCA9ICgpID0+IHsgfVxuICAgICAgc2lub24uc3R1YihjbGllbnQuX2dsb2JhbEFjY2VwdFVudGFnZ2VkLCAnVEVTVCcpXG5cbiAgICAgIGNsaWVudC5fY3VycmVudENvbW1hbmQgPSB7XG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICBURVNUOiBbXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjbGllbnQuX2hhbmRsZVJlc3BvbnNlKHtcbiAgICAgICAgdGFnOiAnKicsXG4gICAgICAgIGNvbW1hbmQ6ICd0ZXN0J1xuICAgICAgfSlcblxuICAgICAgZXhwZWN0KGNsaWVudC5fZ2xvYmFsQWNjZXB0VW50YWdnZWQuVEVTVC5jYWxsQ291bnQpLnRvLmVxdWFsKDApXG4gICAgICBleHBlY3QoY2xpZW50Ll9jdXJyZW50Q29tbWFuZC5wYXlsb2FkLlRFU1QpLnRvLmRlZXAuZXF1YWwoW3tcbiAgICAgICAgdGFnOiAnKicsXG4gICAgICAgIGNvbW1hbmQ6ICd0ZXN0J1xuICAgICAgfV0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW52b2tlIGNvbW1hbmQgY2FsbGJhY2snLCAoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGNsaWVudCwgJ19wcm9jZXNzUmVzcG9uc2UnKVxuICAgICAgc2lub24uc3R1YihjbGllbnQsICdfc2VuZFJlcXVlc3QnKVxuICAgICAgY2xpZW50Ll9nbG9iYWxBY2NlcHRVbnRhZ2dlZC5URVNUID0gKCkgPT4geyB9XG4gICAgICBzaW5vbi5zdHViKGNsaWVudC5fZ2xvYmFsQWNjZXB0VW50YWdnZWQsICdURVNUJylcblxuICAgICAgY2xpZW50Ll9jdXJyZW50Q29tbWFuZCA9IHtcbiAgICAgICAgdGFnOiAnQScsXG4gICAgICAgIGNhbGxiYWNrOiAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICBleHBlY3QocmVzcG9uc2UpLnRvLmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgdGFnOiAnQScsXG4gICAgICAgICAgICBjb21tYW5kOiAndGVzdCcsXG4gICAgICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgICAgIFRFU1Q6ICdhYmMnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgIFRFU1Q6ICdhYmMnXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNsaWVudC5faGFuZGxlUmVzcG9uc2Uoe1xuICAgICAgICB0YWc6ICdBJyxcbiAgICAgICAgY29tbWFuZDogJ3Rlc3QnXG4gICAgICB9KVxuXG4gICAgICBleHBlY3QoY2xpZW50Ll9zZW5kUmVxdWVzdC5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICBleHBlY3QoY2xpZW50Ll9nbG9iYWxBY2NlcHRVbnRhZ2dlZC5URVNULmNhbGxDb3VudCkudG8uZXF1YWwoMClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjZW5xdWV1ZUNvbW1hbmQnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZWplY3Qgb24gTk8vQkFEJywgKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihjbGllbnQsICdfc2VuZFJlcXVlc3QnKS5jYWxsc0Zha2UoKCkgPT4ge1xuICAgICAgICBjbGllbnQuX2NsaWVudFF1ZXVlWzBdLmNhbGxiYWNrKHsgY29tbWFuZDogJ05PJyB9KVxuICAgICAgfSlcblxuICAgICAgY2xpZW50Ll90YWdDb3VudGVyID0gMTAwXG4gICAgICBjbGllbnQuX2NsaWVudFF1ZXVlID0gW11cbiAgICAgIGNsaWVudC5fY2FuU2VuZCA9IHRydWVcblxuICAgICAgcmV0dXJuIGNsaWVudC5lbnF1ZXVlQ29tbWFuZCh7XG4gICAgICAgIGNvbW1hbmQ6ICdhYmMnXG4gICAgICB9LCBbJ2RlZiddLCB7XG4gICAgICAgIHQ6IDFcbiAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgZXhwZWN0KGVycikudG8uZXhpc3RcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW52b2tlIHNlbmRpbmcnLCAoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGNsaWVudCwgJ19zZW5kUmVxdWVzdCcpLmNhbGxzRmFrZSgoKSA9PiB7XG4gICAgICAgIGNsaWVudC5fY2xpZW50UXVldWVbMF0uY2FsbGJhY2soe30pXG4gICAgICB9KVxuXG4gICAgICBjbGllbnQuX3RhZ0NvdW50ZXIgPSAxMDBcbiAgICAgIGNsaWVudC5fY2xpZW50UXVldWUgPSBbXVxuICAgICAgY2xpZW50Ll9jYW5TZW5kID0gdHJ1ZVxuXG4gICAgICByZXR1cm4gY2xpZW50LmVucXVldWVDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogJ2FiYydcbiAgICAgIH0sIFsnZGVmJ10sIHtcbiAgICAgICAgdDogMVxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChjbGllbnQuX3NlbmRSZXF1ZXN0LmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KGNsaWVudC5fY2xpZW50UXVldWUubGVuZ3RoKS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoY2xpZW50Ll9jbGllbnRRdWV1ZVswXS50YWcpLnRvLmVxdWFsKCdXMTAxJylcbiAgICAgICAgZXhwZWN0KGNsaWVudC5fY2xpZW50UXVldWVbMF0ucmVxdWVzdCkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgICAgY29tbWFuZDogJ2FiYycsXG4gICAgICAgICAgdGFnOiAnVzEwMSdcbiAgICAgICAgfSlcbiAgICAgICAgZXhwZWN0KGNsaWVudC5fY2xpZW50UXVldWVbMF0udCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgb25seSBxdWV1ZScsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoY2xpZW50LCAnX3NlbmRSZXF1ZXN0JylcblxuICAgICAgY2xpZW50Ll90YWdDb3VudGVyID0gMTAwXG4gICAgICBjbGllbnQuX2NsaWVudFF1ZXVlID0gW11cbiAgICAgIGNsaWVudC5fY2FuU2VuZCA9IGZhbHNlXG5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4geyBjbGllbnQuX2NsaWVudFF1ZXVlWzBdLmNhbGxiYWNrKHt9KSB9LCAwKVxuXG4gICAgICByZXR1cm4gY2xpZW50LmVucXVldWVDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogJ2FiYydcbiAgICAgIH0sIFsnZGVmJ10sIHtcbiAgICAgICAgdDogMVxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChjbGllbnQuX3NlbmRSZXF1ZXN0LmNhbGxDb3VudCkudG8uZXF1YWwoMClcbiAgICAgICAgZXhwZWN0KGNsaWVudC5fY2xpZW50UXVldWUubGVuZ3RoKS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoY2xpZW50Ll9jbGllbnRRdWV1ZVswXS50YWcpLnRvLmVxdWFsKCdXMTAxJylcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3RvcmUgdmFsdWVBc1N0cmluZyBvcHRpb24gaW4gdGhlIGNvbW1hbmQnLCAoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGNsaWVudCwgJ19zZW5kUmVxdWVzdCcpXG5cbiAgICAgIGNsaWVudC5fdGFnQ291bnRlciA9IDEwMFxuICAgICAgY2xpZW50Ll9jbGllbnRRdWV1ZSA9IFtdXG4gICAgICBjbGllbnQuX2NhblNlbmQgPSBmYWxzZVxuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHsgY2xpZW50Ll9jbGllbnRRdWV1ZVswXS5jYWxsYmFjayh7fSkgfSwgMClcbiAgICAgIHJldHVybiBjbGllbnQuZW5xdWV1ZUNvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiAnYWJjJyxcbiAgICAgICAgdmFsdWVBc1N0cmluZzogZmFsc2VcbiAgICAgIH0sIFsnZGVmJ10sIHtcbiAgICAgICAgdDogMVxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChjbGllbnQuX2NsaWVudFF1ZXVlWzBdLnJlcXVlc3QudmFsdWVBc1N0cmluZykudG8uZXF1YWwoZmFsc2UpXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNfc2VuZFJlcXVlc3QnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBlbnRlciBpZGxlIGlmIG5vdGhpbmcgaXMgdG8gcHJvY2VzcycsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoY2xpZW50LCAnX2VudGVySWRsZScpXG5cbiAgICAgIGNsaWVudC5fY2xpZW50UXVldWUgPSBbXVxuICAgICAgY2xpZW50Ll9zZW5kUmVxdWVzdCgpXG5cbiAgICAgIGV4cGVjdChjbGllbnQuX2VudGVySWRsZS5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc2VuZCBkYXRhJywgKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihjbGllbnQsICdfY2xlYXJJZGxlJylcbiAgICAgIHNpbm9uLnN0dWIoY2xpZW50LCAnc2VuZCcpXG5cbiAgICAgIGNsaWVudC5fY2xpZW50UXVldWUgPSBbe1xuICAgICAgICByZXF1ZXN0OiB7XG4gICAgICAgICAgdGFnOiAnVzEwMScsXG4gICAgICAgICAgY29tbWFuZDogJ1RFU1QnXG4gICAgICAgIH1cbiAgICAgIH1dXG4gICAgICBjbGllbnQuX3NlbmRSZXF1ZXN0KClcblxuICAgICAgZXhwZWN0KGNsaWVudC5fY2xlYXJJZGxlLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIGV4cGVjdChjbGllbnQuc2VuZC5hcmdzWzBdWzBdKS50by5lcXVhbCgnVzEwMSBURVNUXFxyXFxuJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzZW5kIHBhcnRpYWwgZGF0YScsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoY2xpZW50LCAnX2NsZWFySWRsZScpXG4gICAgICBzaW5vbi5zdHViKGNsaWVudCwgJ3NlbmQnKVxuXG4gICAgICBjbGllbnQuX2NsaWVudFF1ZXVlID0gW3tcbiAgICAgICAgcmVxdWVzdDoge1xuICAgICAgICAgIHRhZzogJ1cxMDEnLFxuICAgICAgICAgIGNvbW1hbmQ6ICdURVNUJyxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICAgICAgdHlwZTogJ0xJVEVSQUwnLFxuICAgICAgICAgICAgdmFsdWU6ICdhYmMnXG4gICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgICAgfV1cbiAgICAgIGNsaWVudC5fc2VuZFJlcXVlc3QoKVxuXG4gICAgICBleHBlY3QoY2xpZW50Ll9jbGVhcklkbGUuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgZXhwZWN0KGNsaWVudC5zZW5kLmFyZ3NbMF1bMF0pLnRvLmVxdWFsKCdXMTAxIFRFU1QgezN9XFxyXFxuJylcbiAgICAgIGV4cGVjdChjbGllbnQuX2N1cnJlbnRDb21tYW5kLmRhdGEpLnRvLmRlZXAuZXF1YWwoWydhYmMnXSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBydW4gcHJlY2hlY2snLCAoZG9uZSkgPT4ge1xuICAgICAgc2lub24uc3R1YihjbGllbnQsICdfY2xlYXJJZGxlJylcblxuICAgICAgY2xpZW50Ll9jYW5TZW5kID0gdHJ1ZVxuICAgICAgY2xpZW50Ll9jbGllbnRRdWV1ZSA9IFt7XG4gICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICB0YWc6ICdXMTAxJyxcbiAgICAgICAgICBjb21tYW5kOiAnVEVTVCcsXG4gICAgICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgICAgIHR5cGU6ICdMSVRFUkFMJyxcbiAgICAgICAgICAgIHZhbHVlOiAnYWJjJ1xuICAgICAgICAgIH1dXG4gICAgICAgIH0sXG4gICAgICAgIHByZWNoZWNrOiAoY3R4KSA9PiB7XG4gICAgICAgICAgZXhwZWN0KGN0eCkudG8uZXhpc3RcbiAgICAgICAgICBleHBlY3QoY2xpZW50Ll9jYW5TZW5kKS50by5iZS50cnVlXG4gICAgICAgICAgY2xpZW50Ll9zZW5kUmVxdWVzdCA9ICgpID0+IHtcbiAgICAgICAgICAgIGV4cGVjdChjbGllbnQuX2NsaWVudFF1ZXVlLmxlbmd0aCkudG8uZXF1YWwoMilcbiAgICAgICAgICAgIGV4cGVjdChjbGllbnQuX2NsaWVudFF1ZXVlWzBdLnRhZykudG8uaW5jbHVkZSgnLnAnKVxuICAgICAgICAgICAgZXhwZWN0KGNsaWVudC5fY2xpZW50UXVldWVbMF0ucmVxdWVzdC50YWcpLnRvLmluY2x1ZGUoJy5wJylcbiAgICAgICAgICAgIGNsaWVudC5fY2xlYXJJZGxlLnJlc3RvcmUoKVxuICAgICAgICAgICAgZG9uZSgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGNsaWVudC5lbnF1ZXVlQ29tbWFuZCh7fSwgdW5kZWZpbmVkLCB7XG4gICAgICAgICAgICBjdHg6IGN0eFxuICAgICAgICAgIH0pXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAgIH1cbiAgICAgIH1dXG4gICAgICBjbGllbnQuX3NlbmRSZXF1ZXN0KClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjX2VudGVySWRsZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHNldCBpZGxlIHRpbWVyJywgKGRvbmUpID0+IHtcbiAgICAgIGNsaWVudC5vbmlkbGUgPSAoKSA9PiB7XG4gICAgICAgIGRvbmUoKVxuICAgICAgfVxuICAgICAgY2xpZW50LnRpbWVvdXRFbnRlcklkbGUgPSAxXG5cbiAgICAgIGNsaWVudC5fZW50ZXJJZGxlKClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjX3Byb2Nlc3NSZXNwb25zZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHNldCBodW1hblJlYWRhYmxlJywgKCkgPT4ge1xuICAgICAgdmFyIHJlc3BvbnNlID0ge1xuICAgICAgICB0YWc6ICcqJyxcbiAgICAgICAgY29tbWFuZDogJ09LJyxcbiAgICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgICB0eXBlOiAnVEVYVCcsXG4gICAgICAgICAgdmFsdWU6ICdTb21lIHJhbmRvbSB0ZXh0J1xuICAgICAgICB9XVxuICAgICAgfVxuICAgICAgY2xpZW50Ll9wcm9jZXNzUmVzcG9uc2UocmVzcG9uc2UpXG5cbiAgICAgIGV4cGVjdChyZXNwb25zZS5odW1hblJlYWRhYmxlKS50by5lcXVhbCgnU29tZSByYW5kb20gdGV4dCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc2V0IHJlc3BvbnNlIGNvZGUnLCAoKSA9PiB7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7XG4gICAgICAgIHRhZzogJyonLFxuICAgICAgICBjb21tYW5kOiAnT0snLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgICBzZWN0aW9uOiBbe1xuICAgICAgICAgICAgdHlwZTogJ0FUT00nLFxuICAgICAgICAgICAgdmFsdWU6ICdDQVBBQklMSVRZJ1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgICAgIHZhbHVlOiAnSU1BUDRSRVYxJ1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgICAgIHZhbHVlOiAnVUlEUExVUydcbiAgICAgICAgICB9XVxuICAgICAgICB9LCB7XG4gICAgICAgICAgdHlwZTogJ1RFWFQnLFxuICAgICAgICAgIHZhbHVlOiAnU29tZSByYW5kb20gdGV4dCdcbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICAgIGNsaWVudC5fcHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKVxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmNvZGUpLnRvLmVxdWFsKCdDQVBBQklMSVRZJylcbiAgICAgIGV4cGVjdChyZXNwb25zZS5jYXBhYmlsaXR5KS50by5kZWVwLmVxdWFsKFsnSU1BUDRSRVYxJywgJ1VJRFBMVVMnXSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjaXNFcnJvcicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGRldGVjdCBpZiBhbiBvYmplY3QgaXMgYW4gZXJyb3InLCAoKSA9PiB7XG4gICAgICBleHBlY3QoY2xpZW50LmlzRXJyb3IobmV3IFJhbmdlRXJyb3IoJ2FiYycpKSkudG8uYmUudHJ1ZVxuICAgICAgZXhwZWN0KGNsaWVudC5pc0Vycm9yKCdhYmMnKSkudG8uYmUuZmFsc2VcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjZW5hYmxlQ29tcHJlc3Npb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgaW5mbGF0ZXIgYW5kIGRlZmxhdGVyIHN0cmVhbXMnLCAoKSA9PiB7XG4gICAgICBjbGllbnQuc29ja2V0Lm9uZGF0YSA9ICgpID0+IHsgfVxuICAgICAgc2lub24uc3R1YihjbGllbnQuc29ja2V0LCAnb25kYXRhJylcblxuICAgICAgZXhwZWN0KGNsaWVudC5jb21wcmVzc2VkKS50by5iZS5mYWxzZVxuICAgICAgY2xpZW50LmVuYWJsZUNvbXByZXNzaW9uKClcbiAgICAgIGV4cGVjdChjbGllbnQuY29tcHJlc3NlZCkudG8uYmUudHJ1ZVxuXG4gICAgICBjb25zdCBwYXlsb2FkID0gJ2FzZGFzZCdcbiAgICAgIGNvbnN0IGV4cGVjdGVkID0gcGF5bG9hZC5zcGxpdCgnJykubWFwKGNoYXIgPT4gY2hhci5jaGFyQ29kZUF0KDApKVxuXG4gICAgICBjbGllbnQuc2VuZChwYXlsb2FkKVxuICAgICAgY29uc3QgYWN0dWFsT3V0ID0gc29ja2V0U3R1Yi5zZW5kLmFyZ3NbMF1bMF1cbiAgICAgIGNsaWVudC5zb2NrZXQub25kYXRhKHsgZGF0YTogYWN0dWFsT3V0IH0pXG4gICAgICBleHBlY3QoQnVmZmVyLmZyb20oY2xpZW50Ll9zb2NrZXRPbkRhdGEuYXJnc1swXVswXS5kYXRhKSkudG8uZGVlcC5lcXVhbChCdWZmZXIuZnJvbShleHBlY3RlZCkpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI2dldFByZXZpb3VzbHlRdWV1ZWQnLCAoKSA9PiB7XG4gICAgY29uc3QgY3R4ID0ge31cblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIHVuZGVmaW5lZCB3aXRoIGVtcHR5IHF1ZXVlIGFuZCBubyBjdXJyZW50IGNvbW1hbmQnLCAoKSA9PiB7XG4gICAgICBjbGllbnQuX2N1cnJlbnRDb21tYW5kID0gdW5kZWZpbmVkXG4gICAgICBjbGllbnQuX2NsaWVudFF1ZXVlID0gW11cblxuICAgICAgZXhwZWN0KHRlc3RBbmRHZXRBdHRyaWJ1dGUoKSkudG8uYmUudW5kZWZpbmVkXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIHVuZGVmaW5lZCB3aXRoIGVtcHR5IHF1ZXVlIGFuZCBub24tU0VMRUNUIGN1cnJlbnQgY29tbWFuZCcsICgpID0+IHtcbiAgICAgIGNsaWVudC5fY3VycmVudENvbW1hbmQgPSBjcmVhdGVDb21tYW5kKCdURVNUJylcbiAgICAgIGNsaWVudC5fY2xpZW50UXVldWUgPSBbXVxuXG4gICAgICBleHBlY3QodGVzdEFuZEdldEF0dHJpYnV0ZSgpKS50by5iZS51bmRlZmluZWRcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gY3VycmVudCBjb21tYW5kIHdpdGggZW1wdHkgcXVldWUgYW5kIFNFTEVDVCBjdXJyZW50IGNvbW1hbmQnLCAoKSA9PiB7XG4gICAgICBjbGllbnQuX2N1cnJlbnRDb21tYW5kID0gY3JlYXRlQ29tbWFuZCgnU0VMRUNUJywgJ0FUVFInKVxuICAgICAgY2xpZW50Ll9jbGllbnRRdWV1ZSA9IFtdXG5cbiAgICAgIGV4cGVjdCh0ZXN0QW5kR2V0QXR0cmlidXRlKCkpLnRvLmVxdWFsKCdBVFRSJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gY3VycmVudCBjb21tYW5kIHdpdGggbm9uLVNFTEVDVCBjb21tYW5kcyBpbiBxdWV1ZSBhbmQgU0VMRUNUIGN1cnJlbnQgY29tbWFuZCcsICgpID0+IHtcbiAgICAgIGNsaWVudC5fY3VycmVudENvbW1hbmQgPSBjcmVhdGVDb21tYW5kKCdTRUxFQ1QnLCAnQVRUUicpXG4gICAgICBjbGllbnQuX2NsaWVudFF1ZXVlID0gW1xuICAgICAgICBjcmVhdGVDb21tYW5kKCdURVNUMDEnKSxcbiAgICAgICAgY3JlYXRlQ29tbWFuZCgnVEVTVDAyJylcbiAgICAgIF1cblxuICAgICAgZXhwZWN0KHRlc3RBbmRHZXRBdHRyaWJ1dGUoKSkudG8uZXF1YWwoJ0FUVFInKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBsYXN0IFNFTEVDVCBiZWZvcmUgY3R4IHdpdGggbXVsdGlwbGUgU0VMRUNUIGNvbW1hbmRzIGluIHF1ZXVlICgxKScsICgpID0+IHtcbiAgICAgIGNsaWVudC5fY3VycmVudENvbW1hbmQgPSBjcmVhdGVDb21tYW5kKCdTRUxFQ1QnLCAnQVRUUjAxJylcbiAgICAgIGNsaWVudC5fY2xpZW50UXVldWUgPSBbXG4gICAgICAgIGNyZWF0ZUNvbW1hbmQoJ1NFTEVDVCcsICdBVFRSJyksXG4gICAgICAgIGNyZWF0ZUNvbW1hbmQoJ1RFU1QnKSxcbiAgICAgICAgY3R4LFxuICAgICAgICBjcmVhdGVDb21tYW5kKCdTRUxFQ1QnLCAnQVRUUjAzJylcbiAgICAgIF1cblxuICAgICAgZXhwZWN0KHRlc3RBbmRHZXRBdHRyaWJ1dGUoKSkudG8uZXF1YWwoJ0FUVFInKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBsYXN0IFNFTEVDVCBiZWZvcmUgY3R4IHdpdGggbXVsdGlwbGUgU0VMRUNUIGNvbW1hbmRzIGluIHF1ZXVlICgyKScsICgpID0+IHtcbiAgICAgIGNsaWVudC5fY2xpZW50UXVldWUgPSBbXG4gICAgICAgIGNyZWF0ZUNvbW1hbmQoJ1NFTEVDVCcsICdBVFRSMDInKSxcbiAgICAgICAgY3JlYXRlQ29tbWFuZCgnU0VMRUNUJywgJ0FUVFInKSxcbiAgICAgICAgY3R4LFxuICAgICAgICBjcmVhdGVDb21tYW5kKCdTRUxFQ1QnLCAnQVRUUjAzJylcbiAgICAgIF1cblxuICAgICAgZXhwZWN0KHRlc3RBbmRHZXRBdHRyaWJ1dGUoKSkudG8uZXF1YWwoJ0FUVFInKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBsYXN0IFNFTEVDVCBiZWZvcmUgY3R4IHdpdGggbXVsdGlwbGUgU0VMRUNUIGNvbW1hbmRzIGluIHF1ZXVlICgzKScsICgpID0+IHtcbiAgICAgIGNsaWVudC5fY2xpZW50UXVldWUgPSBbXG4gICAgICAgIGNyZWF0ZUNvbW1hbmQoJ1NFTEVDVCcsICdBVFRSMDInKSxcbiAgICAgICAgY3JlYXRlQ29tbWFuZCgnU0VMRUNUJywgJ0FUVFInKSxcbiAgICAgICAgY3JlYXRlQ29tbWFuZCgnVEVTVCcpLFxuICAgICAgICBjdHgsXG4gICAgICAgIGNyZWF0ZUNvbW1hbmQoJ1NFTEVDVCcsICdBVFRSMDMnKVxuICAgICAgXVxuXG4gICAgICBleHBlY3QodGVzdEFuZEdldEF0dHJpYnV0ZSgpKS50by5lcXVhbCgnQVRUUicpXG4gICAgfSlcblxuICAgIGZ1bmN0aW9uIHRlc3RBbmRHZXRBdHRyaWJ1dGUgKCkge1xuICAgICAgY29uc3QgZGF0YSA9IGNsaWVudC5nZXRQcmV2aW91c2x5UXVldWVkKFsnU0VMRUNUJ10sIGN0eClcbiAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgIHJldHVybiBkYXRhLnJlcXVlc3QuYXR0cmlidXRlc1swXS52YWx1ZVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUNvbW1hbmQgKGNvbW1hbmQsIGF0dHJpYnV0ZSkge1xuICAgICAgY29uc3QgYXR0cmlidXRlcyA9IFtdXG4gICAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICByZXF1ZXN0OiB7IGNvbW1hbmQsIGF0dHJpYnV0ZXMgfVxuICAgICAgfVxuXG4gICAgICBpZiAoYXR0cmlidXRlKSB7XG4gICAgICAgIGRhdGEucmVxdWVzdC5hdHRyaWJ1dGVzLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdTVFJJTkcnLFxuICAgICAgICAgIHZhbHVlOiBhdHRyaWJ1dGVcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRhdGFcbiAgICB9XG4gIH0pXG59KVxuIl19