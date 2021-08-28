/* eslint-disable no-unused-expressions */
import ImapClient, { STATE_SELECTED, STATE_LOGOUT } from './client';
import { parser } from 'emailjs-imap-handler';
import { toTypedArray, LOG_LEVEL_NONE as logLevel } from './common';
describe('browserbox unit tests', function () {
  var br;
  beforeEach(function () {
    var auth = {
      user: 'baldrian',
      pass: 'sleeper.de'
    };
    br = new ImapClient('somehost', 1234, {
      auth: auth,
      logLevel: logLevel
    });
    br.client.socket = {
      send: function send() {},
      upgradeToSecure: function upgradeToSecure() {}
    };
  });
  describe('#_onIdle', function () {
    it('should call enterIdle', function () {
      sinon.stub(br, 'enterIdle');
      br._authenticated = true;
      br._enteredIdle = false;

      br._onIdle();

      expect(br.enterIdle.callCount).to.equal(1);
    });
    it('should not call enterIdle', function () {
      sinon.stub(br, 'enterIdle');
      br._enteredIdle = true;

      br._onIdle();

      expect(br.enterIdle.callCount).to.equal(0);
    });
  });
  describe('#openConnection', function () {
    beforeEach(function () {
      sinon.stub(br.client, 'connect');
      sinon.stub(br.client, 'close');
      sinon.stub(br.client, 'enqueueCommand');
    });
    it('should open connection', function () {
      br.client.connect.returns(Promise.resolve());
      br.client.enqueueCommand.returns(Promise.resolve({
        capability: ['capa1', 'capa2']
      }));
      setTimeout(function () {
        return br.client.onready();
      }, 0);
      return br.openConnection().then(function () {
        expect(br.client.connect.calledOnce).to.be["true"];
        expect(br.client.enqueueCommand.calledOnce).to.be["true"];
        expect(br._capability.length).to.equal(2);
        expect(br._capability[0]).to.equal('capa1');
        expect(br._capability[1]).to.equal('capa2');
      });
    });
  });
  describe('#connect', function () {
    beforeEach(function () {
      sinon.stub(br.client, 'connect');
      sinon.stub(br.client, 'close');
      sinon.stub(br, 'updateCapability');
      sinon.stub(br, 'upgradeConnection');
      sinon.stub(br, 'updateId');
      sinon.stub(br, 'login');
      sinon.stub(br, 'compressConnection');
    });
    it('should connect', function () {
      br.client.connect.returns(Promise.resolve());
      br.updateCapability.returns(Promise.resolve());
      br.upgradeConnection.returns(Promise.resolve());
      br.updateId.returns(Promise.resolve());
      br.login.returns(Promise.resolve());
      br.compressConnection.returns(Promise.resolve());
      setTimeout(function () {
        return br.client.onready();
      }, 0);
      return br.connect().then(function () {
        expect(br.client.connect.calledOnce).to.be["true"];
        expect(br.updateCapability.calledOnce).to.be["true"];
        expect(br.upgradeConnection.calledOnce).to.be["true"];
        expect(br.updateId.calledOnce).to.be["true"];
        expect(br.login.calledOnce).to.be["true"];
        expect(br.compressConnection.calledOnce).to.be["true"];
      });
    });
    it('should fail to login', function (done) {
      br.client.connect.returns(Promise.resolve());
      br.updateCapability.returns(Promise.resolve());
      br.upgradeConnection.returns(Promise.resolve());
      br.updateId.returns(Promise.resolve());
      br.login["throws"](new Error());
      setTimeout(function () {
        return br.client.onready();
      }, 0);
      br.connect()["catch"](function (err) {
        expect(err).to.exist;
        expect(br.client.connect.calledOnce).to.be["true"];
        expect(br.client.close.calledOnce).to.be["true"];
        expect(br.updateCapability.calledOnce).to.be["true"];
        expect(br.upgradeConnection.calledOnce).to.be["true"];
        expect(br.updateId.calledOnce).to.be["true"];
        expect(br.login.calledOnce).to.be["true"];
        expect(br.compressConnection.called).to.be["false"];
        done();
      });
    });
    it('should timeout', function (done) {
      br.client.connect.returns(Promise.resolve());
      br.timeoutConnection = 1;
      br.connect()["catch"](function (err) {
        expect(err).to.exist;
        expect(br.client.connect.calledOnce).to.be["true"];
        expect(br.client.close.calledOnce).to.be["true"];
        expect(br.updateCapability.called).to.be["false"];
        expect(br.upgradeConnection.called).to.be["false"];
        expect(br.updateId.called).to.be["false"];
        expect(br.login.called).to.be["false"];
        expect(br.compressConnection.called).to.be["false"];
        done();
      });
    });
  });
  describe('#close', function () {
    it('should force-close', function () {
      sinon.stub(br.client, 'close').returns(Promise.resolve());
      return br.close().then(function () {
        expect(br._state).to.equal(STATE_LOGOUT);
        expect(br.client.close.calledOnce).to.be["true"];
      });
    });
  });
  describe('#exec', function () {
    beforeEach(function () {
      sinon.stub(br, 'breakIdle');
    });
    it('should send string command', function () {
      sinon.stub(br.client, 'enqueueCommand').returns(Promise.resolve({}));
      return br.exec('TEST').then(function (res) {
        expect(res).to.deep.equal({});
        expect(br.client.enqueueCommand.args[0][0]).to.equal('TEST');
      });
    });
    it('should update capability from response', function () {
      sinon.stub(br.client, 'enqueueCommand').returns(Promise.resolve({
        capability: ['A', 'B']
      }));
      return br.exec('TEST').then(function (res) {
        expect(res).to.deep.equal({
          capability: ['A', 'B']
        });
        expect(br._capability).to.deep.equal(['A', 'B']);
      });
    });
  });
  describe('#enterIdle', function () {
    it('should periodically send NOOP if IDLE not supported', function (done) {
      sinon.stub(br, 'exec').callsFake(function (command) {
        expect(command).to.equal('NOOP');
        done();
      });
      br._capability = [];
      br._selectedMailbox = 'FOO';
      br.timeoutNoop = 1;
      br.enterIdle();
    });
    it('should periodically send NOOP if no mailbox selected', function (done) {
      sinon.stub(br, 'exec').callsFake(function (command) {
        expect(command).to.equal('NOOP');
        done();
      });
      br._capability = ['IDLE'];
      br._selectedMailbox = undefined;
      br.timeoutNoop = 1;
      br.enterIdle();
    });
    it('should break IDLE after timeout', function (done) {
      sinon.stub(br.client, 'enqueueCommand');
      sinon.stub(br.client.socket, 'send').callsFake(function (payload) {
        expect(br.client.enqueueCommand.args[0][0].command).to.equal('IDLE');
        expect([].slice.call(new Uint8Array(payload))).to.deep.equal([0x44, 0x4f, 0x4e, 0x45, 0x0d, 0x0a]);
        done();
      });
      br._capability = ['IDLE'];
      br._selectedMailbox = 'FOO';
      br.timeoutIdle = 1;
      br.enterIdle();
    });
  });
  describe('#breakIdle', function () {
    it('should send DONE to socket', function () {
      sinon.stub(br.client.socket, 'send');
      br._enteredIdle = 'IDLE';
      br.breakIdle();
      expect([].slice.call(new Uint8Array(br.client.socket.send.args[0][0]))).to.deep.equal([0x44, 0x4f, 0x4e, 0x45, 0x0d, 0x0a]);
    });
  });
  describe('#upgradeConnection', function () {
    it('should do nothing if already secured', function () {
      br.client.secureMode = true;
      br._capability = ['starttls'];
      return br.upgradeConnection();
    });
    it('should do nothing if STARTTLS not available', function () {
      br.client.secureMode = false;
      br._capability = [];
      return br.upgradeConnection();
    });
    it('should run STARTTLS', function () {
      sinon.stub(br.client, 'upgrade');
      sinon.stub(br, 'exec').withArgs('STARTTLS').returns(Promise.resolve());
      sinon.stub(br, 'updateCapability').returns(Promise.resolve());
      br._capability = ['STARTTLS'];
      return br.upgradeConnection().then(function () {
        expect(br.client.upgrade.callCount).to.equal(1);
        expect(br._capability.length).to.equal(0);
      });
    });
  });
  describe('#updateCapability', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
    });
    it('should do nothing if capability is set', function () {
      br._capability = ['abc'];
      return br.updateCapability();
    });
    it('should run CAPABILITY if capability not set', function () {
      br.exec.returns(Promise.resolve());
      br._capability = [];
      return br.updateCapability().then(function () {
        expect(br.exec.args[0][0]).to.equal('CAPABILITY');
      });
    });
    it('should force run CAPABILITY', function () {
      br.exec.returns(Promise.resolve());
      br._capability = ['abc'];
      return br.updateCapability(true).then(function () {
        expect(br.exec.args[0][0]).to.equal('CAPABILITY');
      });
    });
    it('should do nothing if connection is not yet upgraded', function () {
      br._capability = [];
      br.client.secureMode = false;
      br._requireTLS = true;
      br.updateCapability();
    });
  });
  describe('#listNamespaces', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
    });
    it('should run NAMESPACE if supported', function () {
      br.exec.returns(Promise.resolve({
        payload: {
          NAMESPACE: [{
            attributes: [[[{
              type: 'STRING',
              value: 'INBOX.'
            }, {
              type: 'STRING',
              value: '.'
            }]], null, null]
          }]
        }
      }));
      br._capability = ['NAMESPACE'];
      return br.listNamespaces().then(function (namespaces) {
        expect(namespaces).to.deep.equal({
          personal: [{
            prefix: 'INBOX.',
            delimiter: '.'
          }],
          users: false,
          shared: false
        });
        expect(br.exec.args[0][0]).to.equal('NAMESPACE');
        expect(br.exec.args[0][1]).to.equal('NAMESPACE');
      });
    });
    it('should do nothing if not supported', function () {
      br._capability = [];
      return br.listNamespaces().then(function (namespaces) {
        expect(namespaces).to.be["false"];
        expect(br.exec.callCount).to.equal(0);
      });
    });
  });
  describe('#compressConnection', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
      sinon.stub(br.client, 'enableCompression');
    });
    it('should run COMPRESS=DEFLATE if supported', function () {
      br.exec.withArgs({
        command: 'COMPRESS',
        attributes: [{
          type: 'ATOM',
          value: 'DEFLATE'
        }]
      }).returns(Promise.resolve({}));
      br._enableCompression = true;
      br._capability = ['COMPRESS=DEFLATE'];
      return br.compressConnection().then(function () {
        expect(br.exec.callCount).to.equal(1);
        expect(br.client.enableCompression.callCount).to.equal(1);
      });
    });
    it('should do nothing if not supported', function () {
      br._capability = [];
      return br.compressConnection().then(function () {
        expect(br.exec.callCount).to.equal(0);
      });
    });
    it('should do nothing if not enabled', function () {
      br._enableCompression = false;
      br._capability = ['COMPRESS=DEFLATE'];
      return br.compressConnection().then(function () {
        expect(br.exec.callCount).to.equal(0);
      });
    });
  });
  describe('#login', function () {
    it('should call LOGIN', function () {
      sinon.stub(br, 'exec').returns(Promise.resolve({}));
      sinon.stub(br, 'updateCapability').returns(Promise.resolve(true));
      return br.login({
        user: 'u1',
        pass: 'p1'
      }).then(function () {
        expect(br.exec.callCount).to.equal(1);
        expect(br.exec.args[0][0]).to.deep.equal({
          command: 'login',
          attributes: [{
            type: 'STRING',
            value: 'u1'
          }, {
            type: 'STRING',
            value: 'p1',
            sensitive: true
          }]
        });
      });
    });
    it('should call XOAUTH2', function () {
      sinon.stub(br, 'exec').returns(Promise.resolve({}));
      sinon.stub(br, 'updateCapability').returns(Promise.resolve(true));
      br._capability = ['AUTH=XOAUTH2'];
      br.login({
        user: 'u1',
        xoauth2: 'abc'
      }).then(function () {
        expect(br.exec.callCount).to.equal(1);
        expect(br.exec.args[0][0]).to.deep.equal({
          command: 'AUTHENTICATE',
          attributes: [{
            type: 'ATOM',
            value: 'XOAUTH2'
          }, {
            type: 'ATOM',
            value: 'dXNlcj11MQFhdXRoPUJlYXJlciBhYmMBAQ==',
            sensitive: true
          }]
        });
      });
    });
  });
  describe('#updateId', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
    });
    it('should not nothing if not supported', function () {
      br._capability = [];
      return br.updateId({
        a: 'b',
        c: 'd'
      }).then(function () {
        expect(br.serverId).to.be["false"];
      });
    });
    it('should send NIL', function () {
      br.exec.withArgs({
        command: 'ID',
        attributes: [null]
      }).returns(Promise.resolve({
        payload: {
          ID: [{
            attributes: [null]
          }]
        }
      }));
      br._capability = ['ID'];
      return br.updateId(null).then(function () {
        expect(br.serverId).to.deep.equal({});
      });
    });
    it('should exhange ID values', function () {
      br.exec.withArgs({
        command: 'ID',
        attributes: [['ckey1', 'cval1', 'ckey2', 'cval2']]
      }).returns(Promise.resolve({
        payload: {
          ID: [{
            attributes: [[{
              value: 'skey1'
            }, {
              value: 'sval1'
            }, {
              value: 'skey2'
            }, {
              value: 'sval2'
            }]]
          }]
        }
      }));
      br._capability = ['ID'];
      return br.updateId({
        ckey1: 'cval1',
        ckey2: 'cval2'
      }).then(function () {
        expect(br.serverId).to.deep.equal({
          skey1: 'sval1',
          skey2: 'sval2'
        });
      });
    });
  });
  describe('#listMailboxes', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
    });
    it('should call LIST and LSUB in sequence', function () {
      br.exec.withArgs({
        command: 'LIST',
        attributes: ['', '*']
      }).returns(Promise.resolve({
        payload: {
          LIST: [false]
        }
      }));
      br.exec.withArgs({
        command: 'LSUB',
        attributes: ['', '*']
      }).returns(Promise.resolve({
        payload: {
          LSUB: [false]
        }
      }));
      return br.listMailboxes().then(function (tree) {
        expect(tree).to.exist;
      });
    });
    it('should not die on NIL separators', function () {
      br.exec.withArgs({
        command: 'LIST',
        attributes: ['', '*']
      }).returns(Promise.resolve({
        payload: {
          LIST: [parser(toTypedArray('* LIST (\\NoInferiors) NIL "INBOX"'))]
        }
      }));
      br.exec.withArgs({
        command: 'LSUB',
        attributes: ['', '*']
      }).returns(Promise.resolve({
        payload: {
          LSUB: [parser(toTypedArray('* LSUB (\\NoInferiors) NIL "INBOX"'))]
        }
      }));
      return br.listMailboxes().then(function (tree) {
        expect(tree).to.exist;
      });
    });
  });
  describe('#createMailbox', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
    });
    it('should call CREATE with a string payload', function () {
      // The spec allows unquoted ATOM-style syntax too, but for
      // simplicity we always generate a string even if it could be
      // expressed as an atom.
      br.exec.withArgs({
        command: 'CREATE',
        attributes: ['mailboxname']
      }).returns(Promise.resolve());
      return br.createMailbox('mailboxname').then(function () {
        expect(br.exec.callCount).to.equal(1);
      });
    });
    it('should call mutf7 encode the argument', function () {
      // From RFC 3501
      br.exec.withArgs({
        command: 'CREATE',
        attributes: ['~peter/mail/&U,BTFw-/&ZeVnLIqe-']
      }).returns(Promise.resolve());
      return br.createMailbox("~peter/mail/\u53F0\u5317/\u65E5\u672C\u8A9E").then(function () {
        expect(br.exec.callCount).to.equal(1);
      });
    });
    it('should treat an ALREADYEXISTS response as success', function () {
      var fakeErr = {
        code: 'ALREADYEXISTS'
      };
      br.exec.withArgs({
        command: 'CREATE',
        attributes: ['mailboxname']
      }).returns(Promise.reject(fakeErr));
      return br.createMailbox('mailboxname').then(function () {
        expect(br.exec.callCount).to.equal(1);
      });
    });
  });
  describe('#deleteMailbox', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
    });
    it('should call DELETE with a string payload', function () {
      br.exec.withArgs({
        command: 'DELETE',
        attributes: ['mailboxname']
      }).returns(Promise.resolve());
      return br.deleteMailbox('mailboxname').then(function () {
        expect(br.exec.callCount).to.equal(1);
      });
    });
    it('should call mutf7 encode the argument', function () {
      // From RFC 3501
      br.exec.withArgs({
        command: 'DELETE',
        attributes: ['~peter/mail/&U,BTFw-/&ZeVnLIqe-']
      }).returns(Promise.resolve());
      return br.deleteMailbox("~peter/mail/\u53F0\u5317/\u65E5\u672C\u8A9E").then(function () {
        expect(br.exec.callCount).to.equal(1);
      });
    });
  });
  describe.skip('#listMessages', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
      sinon.stub(br, '_buildFETCHCommand');
      sinon.stub(br, '_parseFETCH');
    });
    it('should call FETCH', function () {
      br.exec.returns(Promise.resolve('abc'));

      br._buildFETCHCommand.withArgs(['1:2', ['uid', 'flags'], {
        byUid: true
      }]).returns({});

      return br.listMessages('INBOX', '1:2', ['uid', 'flags'], {
        byUid: true
      }).then(function () {
        expect(br._buildFETCHCommand.callCount).to.equal(1);
        expect(br._parseFETCH.withArgs('abc').callCount).to.equal(1);
      });
    });
  });
  describe.skip('#search', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
      sinon.stub(br, '_buildSEARCHCommand');
      sinon.stub(br, '_parseSEARCH');
    });
    it('should call SEARCH', function () {
      br.exec.returns(Promise.resolve('abc'));

      br._buildSEARCHCommand.withArgs({
        uid: 1
      }, {
        byUid: true
      }).returns({});

      return br.search('INBOX', {
        uid: 1
      }, {
        byUid: true
      }).then(function () {
        expect(br._buildSEARCHCommand.callCount).to.equal(1);
        expect(br.exec.callCount).to.equal(1);
        expect(br._parseSEARCH.withArgs('abc').callCount).to.equal(1);
      });
    });
  });
  describe('#upload', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
    });
    it('should call APPEND with custom flag', function () {
      br.exec.returns(Promise.resolve());
      return br.upload('mailbox', 'this is a message', {
        flags: ['\\$MyFlag']
      }).then(function () {
        expect(br.exec.callCount).to.equal(1);
      });
    });
    it('should call APPEND w/o flags', function () {
      br.exec.returns(Promise.resolve());
      return br.upload('mailbox', 'this is a message').then(function () {
        expect(br.exec.callCount).to.equal(1);
      });
    });
  });
  describe.skip('#setFlags', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
      sinon.stub(br, '_buildSTORECommand');
      sinon.stub(br, '_parseFETCH');
    });
    it('should call STORE', function () {
      br.exec.returns(Promise.resolve('abc'));

      br._buildSTORECommand.withArgs('1:2', 'FLAGS', ['\\Seen', '$MyFlag'], {
        byUid: true
      }).returns({});

      return br.setFlags('INBOX', '1:2', ['\\Seen', '$MyFlag'], {
        byUid: true
      }).then(function () {
        expect(br.exec.callCount).to.equal(1);
        expect(br._parseFETCH.withArgs('abc').callCount).to.equal(1);
      });
    });
  });
  describe.skip('#store', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
      sinon.stub(br, '_buildSTORECommand');
      sinon.stub(br, '_parseFETCH');
    });
    it('should call STORE', function () {
      br.exec.returns(Promise.resolve('abc'));

      br._buildSTORECommand.withArgs('1:2', '+X-GM-LABELS', ['\\Sent', '\\Junk'], {
        byUid: true
      }).returns({});

      return br.store('INBOX', '1:2', '+X-GM-LABELS', ['\\Sent', '\\Junk'], {
        byUid: true
      }).then(function () {
        expect(br._buildSTORECommand.callCount).to.equal(1);
        expect(br.exec.callCount).to.equal(1);
        expect(br._parseFETCH.withArgs('abc').callCount).to.equal(1);
      });
    });
  });
  describe('#deleteMessages', function () {
    beforeEach(function () {
      sinon.stub(br, 'setFlags');
      sinon.stub(br, 'exec');
    });
    it('should call UID EXPUNGE', function () {
      br.exec.withArgs({
        command: 'UID EXPUNGE',
        attributes: [{
          type: 'sequence',
          value: '1:2'
        }]
      }).returns(Promise.resolve('abc'));
      br.setFlags.withArgs('INBOX', '1:2', {
        add: '\\Deleted'
      }).returns(Promise.resolve());
      br._capability = ['UIDPLUS'];
      return br.deleteMessages('INBOX', '1:2', {
        byUid: true
      }).then(function () {
        expect(br.exec.callCount).to.equal(1);
      });
    });
    it('should call EXPUNGE', function () {
      br.exec.withArgs('EXPUNGE').returns(Promise.resolve('abc'));
      br.setFlags.withArgs('INBOX', '1:2', {
        add: '\\Deleted'
      }).returns(Promise.resolve());
      br._capability = [];
      return br.deleteMessages('INBOX', '1:2', {
        byUid: true
      }).then(function () {
        expect(br.exec.callCount).to.equal(1);
      });
    });
  });
  describe('#copyMessages', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
    });
    it('should call COPY', function () {
      br.exec.withArgs({
        command: 'UID COPY',
        attributes: [{
          type: 'sequence',
          value: '1:2'
        }, {
          type: 'atom',
          value: '[Gmail]/Trash'
        }]
      }).returns(Promise.resolve({
        copyuid: ['1', '1:2', '4,3']
      }));
      return br.copyMessages('INBOX', '1:2', '[Gmail]/Trash', {
        byUid: true
      }).then(function (response) {
        expect(response).to.deep.equal({
          srcSeqSet: '1:2',
          destSeqSet: '4,3'
        });
        expect(br.exec.callCount).to.equal(1);
      });
    });
  });
  describe('#moveMessages', function () {
    beforeEach(function () {
      sinon.stub(br, 'exec');
      sinon.stub(br, 'copyMessages');
      sinon.stub(br, 'deleteMessages');
    });
    it('should call MOVE if supported', function () {
      br.exec.withArgs({
        command: 'UID MOVE',
        attributes: [{
          type: 'sequence',
          value: '1:2'
        }, {
          type: 'atom',
          value: '[Gmail]/Trash'
        }]
      }, ['OK']).returns(Promise.resolve('abc'));
      br._capability = ['MOVE'];
      return br.moveMessages('INBOX', '1:2', '[Gmail]/Trash', {
        byUid: true
      }).then(function () {
        expect(br.exec.callCount).to.equal(1);
      });
    });
    it('should fallback to copy+expunge', function () {
      br.copyMessages.withArgs('INBOX', '1:2', '[Gmail]/Trash', {
        byUid: true
      }).returns(Promise.resolve());
      br.deleteMessages.withArgs('1:2', {
        byUid: true
      }).returns(Promise.resolve());
      br._capability = [];
      return br.moveMessages('INBOX', '1:2', '[Gmail]/Trash', {
        byUid: true
      }).then(function () {
        expect(br.deleteMessages.callCount).to.equal(1);
      });
    });
  });
  describe('#_shouldSelectMailbox', function () {
    it('should return true when ctx is undefined', function () {
      expect(br._shouldSelectMailbox('path')).to.be["true"];
    });
    it('should return true when a different path is queued', function () {
      sinon.stub(br.client, 'getPreviouslyQueued').returns({
        request: {
          command: 'SELECT',
          attributes: [{
            type: 'STRING',
            value: 'queued path'
          }]
        }
      });
      expect(br._shouldSelectMailbox('path', {})).to.be["true"];
    });
    it('should return false when the same path is queued', function () {
      sinon.stub(br.client, 'getPreviouslyQueued').returns({
        request: {
          command: 'SELECT',
          attributes: [{
            type: 'STRING',
            value: 'queued path'
          }]
        }
      });
      expect(br._shouldSelectMailbox('queued path', {})).to.be["false"];
    });
  });
  describe('#selectMailbox', function () {
    var path = '[Gmail]/Trash';
    beforeEach(function () {
      sinon.stub(br, 'exec');
    });
    it('should run SELECT', function () {
      br.exec.withArgs({
        command: 'SELECT',
        attributes: [{
          type: 'STRING',
          value: path
        }]
      }).returns(Promise.resolve({
        code: 'READ-WRITE'
      }));
      return br.selectMailbox(path).then(function () {
        expect(br.exec.callCount).to.equal(1);
        expect(br._state).to.equal(STATE_SELECTED);
      });
    });
    it('should run SELECT with CONDSTORE', function () {
      br.exec.withArgs({
        command: 'SELECT',
        attributes: [{
          type: 'STRING',
          value: path
        }, [{
          type: 'ATOM',
          value: 'CONDSTORE'
        }]]
      }).returns(Promise.resolve({
        code: 'READ-WRITE'
      }));
      br._capability = ['CONDSTORE'];
      return br.selectMailbox(path, {
        condstore: true
      }).then(function () {
        expect(br.exec.callCount).to.equal(1);
        expect(br._state).to.equal(STATE_SELECTED);
      });
    });
    describe('should emit onselectmailbox before selectMailbox is resolved', function () {
      beforeEach(function () {
        br.exec.returns(Promise.resolve({
          code: 'READ-WRITE'
        }));
      });
      it('when it returns a promise', function () {
        var promiseResolved = false;

        br.onselectmailbox = function () {
          return new Promise(function (resolve) {
            resolve();
            promiseResolved = true;
          });
        };

        var onselectmailboxSpy = sinon.spy(br, 'onselectmailbox');
        return br.selectMailbox(path).then(function () {
          expect(onselectmailboxSpy.withArgs(path).callCount).to.equal(1);
          expect(promiseResolved).to.equal(true);
        });
      });
      it('when it does not return a promise', function () {
        br.onselectmailbox = function () {};

        var onselectmailboxSpy = sinon.spy(br, 'onselectmailbox');
        return br.selectMailbox(path).then(function () {
          expect(onselectmailboxSpy.withArgs(path).callCount).to.equal(1);
        });
      });
    });
    it('should emit onclosemailbox', function () {
      var called = false;
      br.exec.returns(Promise.resolve('abc')).returns(Promise.resolve({
        code: 'READ-WRITE'
      }));

      br.onclosemailbox = function (path) {
        expect(path).to.equal('yyy');
        called = true;
      };

      br._selectedMailbox = 'yyy';
      return br.selectMailbox(path).then(function () {
        expect(called).to.be["true"];
      });
    });
  });
  describe('#mailboxStatus', function () {
    var path = 'Inbox';
    beforeEach(function () {
      sinon.stub(br, 'exec');
    });
    it('should run STATUS', function () {
      br.exec.withArgs({
        command: 'STATUS',
        attributes: [{
          type: 'STRING',
          value: path
        }, [{
          type: 'ATOM',
          value: 'UIDNEXT'
        }, {
          type: 'ATOM',
          value: 'MESSAGES'
        }]]
      }).returns(Promise.resolve({
        payload: {
          STATUS: [{
            tag: '*',
            command: 'STATUS',
            attributes: [{
              type: 'ATOM',
              value: path
            }, [{
              type: 'ATOM',
              value: 'UIDNEXT'
            }, {
              type: 'ATOM',
              value: '2824'
            }, {
              type: 'ATOM',
              value: 'MESSAGES'
            }, {
              type: 'ATOM',
              value: '676'
            }]]
          }]
        }
      }));
      return br.mailboxStatus(path).then(function (result) {
        expect(br.exec.callCount).to.equal(1);
        expect(result.uidNext).to.equal(2824);
        expect(result.messages).to.equal(676);
      });
    });
    it('should run STATUS with HIGHESTMODSEQ', function () {
      br._capability = ['CONDSTORE'];
      br.exec.withArgs({
        command: 'STATUS',
        attributes: [{
          type: 'STRING',
          value: path
        }, [{
          type: 'ATOM',
          value: 'UIDNEXT'
        }, {
          type: 'ATOM',
          value: 'MESSAGES'
        }, {
          type: 'ATOM',
          value: 'HIGHESTMODSEQ'
        }]]
      }).returns(Promise.resolve({
        payload: {
          STATUS: [{
            tag: '*',
            command: 'STATUS',
            attributes: [{
              type: 'ATOM',
              value: path
            }, [{
              type: 'ATOM',
              value: 'UIDNEXT'
            }, {
              type: 'ATOM',
              value: '2824'
            }, {
              type: 'ATOM',
              value: 'MESSAGES'
            }, {
              type: 'ATOM',
              value: '676'
            }, {
              type: 'ATOM',
              value: 'HIGHESTMODSEQ'
            }, {
              type: 'ATOM',
              value: '10'
            }]]
          }]
        }
      }));
      return br.mailboxStatus(path, {
        condstore: true
      }).then(function (result) {
        expect(br.exec.callCount).to.equal(1);
        expect(result.uidNext).to.equal(2824);
        expect(result.messages).to.equal(676);
        expect(result.highestModseq).to.equal(10);
      });
    });
    it('should run STATUS with invalid result', function () {
      br.exec.withArgs({
        command: 'STATUS',
        attributes: [{
          type: 'STRING',
          value: path
        }, [{
          type: 'ATOM',
          value: 'UIDNEXT'
        }, {
          type: 'ATOM',
          value: 'MESSAGES'
        }]]
      }).returns(Promise.resolve({
        payload: {
          STATUS: [{
            tag: '*',
            command: 'STATUS',
            attributes: [{
              type: 'ATOM',
              value: path
            }, [{
              type: 'ATOM',
              value: 'UIDNEXT'
            }, {
              type: 'ATOM',
              value: 'youyou'
            }, {
              type: 'ATOM',
              value: 'MESSAGES_invalid'
            }]]
          }]
        }
      }));
      return br.mailboxStatus(path).then(function (result) {
        expect(br.exec.callCount).to.equal(1);
        expect(result.uidNext).to.equal(null);
        expect(result.messages).to.equal(null);
      });
    });
  });
  describe('#hasCapability', function () {
    it('should detect existing capability', function () {
      br._capability = ['ZZZ'];
      expect(br.hasCapability('zzz')).to.be["true"];
    });
    it('should detect non existing capability', function () {
      br._capability = ['ZZZ'];
      expect(br.hasCapability('ooo')).to.be["false"];
      expect(br.hasCapability()).to.be["false"];
    });
  });
  describe('#_untaggedOkHandler', function () {
    it('should update capability if present', function () {
      br._untaggedOkHandler({
        capability: ['abc']
      }, function () {});

      expect(br._capability).to.deep.equal(['abc']);
    });
  });
  describe('#_untaggedCapabilityHandler', function () {
    it('should update capability', function () {
      br._untaggedCapabilityHandler({
        attributes: [{
          value: 'abc'
        }]
      }, function () {});

      expect(br._capability).to.deep.equal(['ABC']);
    });
  });
  describe('#_untaggedExistsHandler', function () {
    it('should emit onupdate', function () {
      br.onupdate = sinon.stub();
      br._selectedMailbox = 'FOO';

      br._untaggedExistsHandler({
        nr: 123
      }, function () {});

      expect(br.onupdate.withArgs('FOO', 'exists', 123).callCount).to.equal(1);
    });
  });
  describe('#_untaggedExpungeHandler', function () {
    it('should emit onupdate', function () {
      br.onupdate = sinon.stub();
      br._selectedMailbox = 'FOO';

      br._untaggedExpungeHandler({
        nr: 123
      }, function () {});

      expect(br.onupdate.withArgs('FOO', 'expunge', 123).callCount).to.equal(1);
    });
  });
  describe.skip('#_untaggedFetchHandler', function () {
    it('should emit onupdate', function () {
      br.onupdate = sinon.stub();
      sinon.stub(br, '_parseFETCH').returns('abc');
      br._selectedMailbox = 'FOO';

      br._untaggedFetchHandler({
        nr: 123
      }, function () {});

      expect(br.onupdate.withArgs('FOO', 'fetch', 'abc').callCount).to.equal(1);
      expect(br._parseFETCH.args[0][0]).to.deep.equal({
        payload: {
          FETCH: [{
            nr: 123
          }]
        }
      });
    });
  });
  describe('#_changeState', function () {
    it('should set the state value', function () {
      br._changeState(12345);

      expect(br._state).to.equal(12345);
    });
    it('should emit onclosemailbox if mailbox was closed', function () {
      br.onclosemailbox = sinon.stub();
      br._state = STATE_SELECTED;
      br._selectedMailbox = 'aaa';

      br._changeState(12345);

      expect(br._selectedMailbox).to.be["false"];
      expect(br.onclosemailbox.withArgs('aaa').callCount).to.equal(1);
    });
  });
  describe('#_ensurePath', function () {
    it('should create the path if not present', function () {
      var tree = {
        children: []
      };
      expect(br._ensurePath(tree, 'hello/world', '/')).to.deep.equal({
        name: 'world',
        delimiter: '/',
        path: 'hello/world',
        children: []
      });
      expect(tree).to.deep.equal({
        children: [{
          name: 'hello',
          delimiter: '/',
          path: 'hello',
          children: [{
            name: 'world',
            delimiter: '/',
            path: 'hello/world',
            children: []
          }]
        }]
      });
    });
    it('should return existing path if possible', function () {
      var tree = {
        children: [{
          name: 'hello',
          delimiter: '/',
          path: 'hello',
          children: [{
            name: 'world',
            delimiter: '/',
            path: 'hello/world',
            children: [],
            abc: 123
          }]
        }]
      };
      expect(br._ensurePath(tree, 'hello/world', '/')).to.deep.equal({
        name: 'world',
        delimiter: '/',
        path: 'hello/world',
        children: [],
        abc: 123
      });
    });
    it('should handle case insensitive Inbox', function () {
      var tree = {
        children: []
      };
      expect(br._ensurePath(tree, 'Inbox/world', '/')).to.deep.equal({
        name: 'world',
        delimiter: '/',
        path: 'Inbox/world',
        children: []
      });
      expect(br._ensurePath(tree, 'INBOX/worlds', '/')).to.deep.equal({
        name: 'worlds',
        delimiter: '/',
        path: 'INBOX/worlds',
        children: []
      });
      expect(tree).to.deep.equal({
        children: [{
          name: 'Inbox',
          delimiter: '/',
          path: 'Inbox',
          children: [{
            name: 'world',
            delimiter: '/',
            path: 'Inbox/world',
            children: []
          }, {
            name: 'worlds',
            delimiter: '/',
            path: 'INBOX/worlds',
            children: []
          }]
        }]
      });
    });
  });
  describe('untagged updates', function () {
    it('should receive information about untagged exists', function (done) {
      br.client._connectionReady = true;
      br._selectedMailbox = 'FOO';

      br.onupdate = function (path, type, value) {
        expect(path).to.equal('FOO');
        expect(type).to.equal('exists');
        expect(value).to.equal(123);
        done();
      };

      br.client._onData({
        /* * 123 EXISTS\r\n */
        data: new Uint8Array([42, 32, 49, 50, 51, 32, 69, 88, 73, 83, 84, 83, 13, 10]).buffer
      });
    });
    it('should receive information about untagged expunge', function (done) {
      br.client._connectionReady = true;
      br._selectedMailbox = 'FOO';

      br.onupdate = function (path, type, value) {
        expect(path).to.equal('FOO');
        expect(type).to.equal('expunge');
        expect(value).to.equal(456);
        done();
      };

      br.client._onData({
        /* * 456 EXPUNGE\r\n */
        data: new Uint8Array([42, 32, 52, 53, 54, 32, 69, 88, 80, 85, 78, 71, 69, 13, 10]).buffer
      });
    });
    it('should receive information about untagged fetch', function (done) {
      br.client._connectionReady = true;
      br._selectedMailbox = 'FOO';

      br.onupdate = function (path, type, value) {
        expect(path).to.equal('FOO');
        expect(type).to.equal('fetch');
        expect(value).to.deep.equal({
          '#': 123,
          flags: ['\\Seen'],
          modseq: '4'
        });
        done();
      };

      br.client._onData({
        /* * 123 FETCH (FLAGS (\\Seen) MODSEQ (4))\r\n */
        data: new Uint8Array([42, 32, 49, 50, 51, 32, 70, 69, 84, 67, 72, 32, 40, 70, 76, 65, 71, 83, 32, 40, 92, 83, 101, 101, 110, 41, 32, 77, 79, 68, 83, 69, 81, 32, 40, 52, 41, 41, 13, 10]).buffer
      });
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGllbnQtdW5pdC5qcyJdLCJuYW1lcyI6WyJJbWFwQ2xpZW50IiwiU1RBVEVfU0VMRUNURUQiLCJTVEFURV9MT0dPVVQiLCJwYXJzZXIiLCJ0b1R5cGVkQXJyYXkiLCJMT0dfTEVWRUxfTk9ORSIsImxvZ0xldmVsIiwiZGVzY3JpYmUiLCJiciIsImJlZm9yZUVhY2giLCJhdXRoIiwidXNlciIsInBhc3MiLCJjbGllbnQiLCJzb2NrZXQiLCJzZW5kIiwidXBncmFkZVRvU2VjdXJlIiwiaXQiLCJzaW5vbiIsInN0dWIiLCJfYXV0aGVudGljYXRlZCIsIl9lbnRlcmVkSWRsZSIsIl9vbklkbGUiLCJleHBlY3QiLCJlbnRlcklkbGUiLCJjYWxsQ291bnQiLCJ0byIsImVxdWFsIiwiY29ubmVjdCIsInJldHVybnMiLCJQcm9taXNlIiwicmVzb2x2ZSIsImVucXVldWVDb21tYW5kIiwiY2FwYWJpbGl0eSIsInNldFRpbWVvdXQiLCJvbnJlYWR5Iiwib3BlbkNvbm5lY3Rpb24iLCJ0aGVuIiwiY2FsbGVkT25jZSIsImJlIiwiX2NhcGFiaWxpdHkiLCJsZW5ndGgiLCJ1cGRhdGVDYXBhYmlsaXR5IiwidXBncmFkZUNvbm5lY3Rpb24iLCJ1cGRhdGVJZCIsImxvZ2luIiwiY29tcHJlc3NDb25uZWN0aW9uIiwiZG9uZSIsIkVycm9yIiwiZXJyIiwiZXhpc3QiLCJjbG9zZSIsImNhbGxlZCIsInRpbWVvdXRDb25uZWN0aW9uIiwiX3N0YXRlIiwiZXhlYyIsInJlcyIsImRlZXAiLCJhcmdzIiwiY2FsbHNGYWtlIiwiY29tbWFuZCIsIl9zZWxlY3RlZE1haWxib3giLCJ0aW1lb3V0Tm9vcCIsInVuZGVmaW5lZCIsInBheWxvYWQiLCJzbGljZSIsImNhbGwiLCJVaW50OEFycmF5IiwidGltZW91dElkbGUiLCJicmVha0lkbGUiLCJzZWN1cmVNb2RlIiwid2l0aEFyZ3MiLCJ1cGdyYWRlIiwiX3JlcXVpcmVUTFMiLCJOQU1FU1BBQ0UiLCJhdHRyaWJ1dGVzIiwidHlwZSIsInZhbHVlIiwibGlzdE5hbWVzcGFjZXMiLCJuYW1lc3BhY2VzIiwicGVyc29uYWwiLCJwcmVmaXgiLCJkZWxpbWl0ZXIiLCJ1c2VycyIsInNoYXJlZCIsIl9lbmFibGVDb21wcmVzc2lvbiIsImVuYWJsZUNvbXByZXNzaW9uIiwic2Vuc2l0aXZlIiwieG9hdXRoMiIsImEiLCJjIiwic2VydmVySWQiLCJJRCIsImNrZXkxIiwiY2tleTIiLCJza2V5MSIsInNrZXkyIiwiTElTVCIsIkxTVUIiLCJsaXN0TWFpbGJveGVzIiwidHJlZSIsImNyZWF0ZU1haWxib3giLCJmYWtlRXJyIiwiY29kZSIsInJlamVjdCIsImRlbGV0ZU1haWxib3giLCJza2lwIiwiX2J1aWxkRkVUQ0hDb21tYW5kIiwiYnlVaWQiLCJsaXN0TWVzc2FnZXMiLCJfcGFyc2VGRVRDSCIsIl9idWlsZFNFQVJDSENvbW1hbmQiLCJ1aWQiLCJzZWFyY2giLCJfcGFyc2VTRUFSQ0giLCJ1cGxvYWQiLCJmbGFncyIsIl9idWlsZFNUT1JFQ29tbWFuZCIsInNldEZsYWdzIiwic3RvcmUiLCJhZGQiLCJkZWxldGVNZXNzYWdlcyIsImNvcHl1aWQiLCJjb3B5TWVzc2FnZXMiLCJyZXNwb25zZSIsInNyY1NlcVNldCIsImRlc3RTZXFTZXQiLCJtb3ZlTWVzc2FnZXMiLCJfc2hvdWxkU2VsZWN0TWFpbGJveCIsInJlcXVlc3QiLCJwYXRoIiwic2VsZWN0TWFpbGJveCIsImNvbmRzdG9yZSIsInByb21pc2VSZXNvbHZlZCIsIm9uc2VsZWN0bWFpbGJveCIsIm9uc2VsZWN0bWFpbGJveFNweSIsInNweSIsIm9uY2xvc2VtYWlsYm94IiwiU1RBVFVTIiwidGFnIiwibWFpbGJveFN0YXR1cyIsInJlc3VsdCIsInVpZE5leHQiLCJtZXNzYWdlcyIsImhpZ2hlc3RNb2RzZXEiLCJoYXNDYXBhYmlsaXR5IiwiX3VudGFnZ2VkT2tIYW5kbGVyIiwiX3VudGFnZ2VkQ2FwYWJpbGl0eUhhbmRsZXIiLCJvbnVwZGF0ZSIsIl91bnRhZ2dlZEV4aXN0c0hhbmRsZXIiLCJuciIsIl91bnRhZ2dlZEV4cHVuZ2VIYW5kbGVyIiwiX3VudGFnZ2VkRmV0Y2hIYW5kbGVyIiwiRkVUQ0giLCJfY2hhbmdlU3RhdGUiLCJjaGlsZHJlbiIsIl9lbnN1cmVQYXRoIiwibmFtZSIsImFiYyIsIl9jb25uZWN0aW9uUmVhZHkiLCJfb25EYXRhIiwiZGF0YSIsImJ1ZmZlciIsIm1vZHNlcSJdLCJtYXBwaW5ncyI6IkFBQUE7QUFFQSxPQUFPQSxVQUFQLElBQXFCQyxjQUFyQixFQUFxQ0MsWUFBckMsUUFBeUQsVUFBekQ7QUFDQSxTQUFTQyxNQUFULFFBQXVCLHNCQUF2QjtBQUNBLFNBQ0VDLFlBREYsRUFFRUMsY0FBYyxJQUFJQyxRQUZwQixRQUdPLFVBSFA7QUFLQUMsUUFBUSxDQUFDLHVCQUFELEVBQTBCLFlBQU07QUFDdEMsTUFBSUMsRUFBSjtBQUVBQyxFQUFBQSxVQUFVLENBQUMsWUFBTTtBQUNmLFFBQU1DLElBQUksR0FBRztBQUFFQyxNQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsTUFBQUEsSUFBSSxFQUFFO0FBQTFCLEtBQWI7QUFDQUosSUFBQUEsRUFBRSxHQUFHLElBQUlSLFVBQUosQ0FBZSxVQUFmLEVBQTJCLElBQTNCLEVBQWlDO0FBQUVVLE1BQUFBLElBQUksRUFBSkEsSUFBRjtBQUFRSixNQUFBQSxRQUFRLEVBQVJBO0FBQVIsS0FBakMsQ0FBTDtBQUNBRSxJQUFBQSxFQUFFLENBQUNLLE1BQUgsQ0FBVUMsTUFBVixHQUFtQjtBQUNqQkMsTUFBQUEsSUFBSSxFQUFFLGdCQUFNLENBQUcsQ0FERTtBQUVqQkMsTUFBQUEsZUFBZSxFQUFFLDJCQUFNLENBQUc7QUFGVCxLQUFuQjtBQUlELEdBUFMsQ0FBVjtBQVNBVCxFQUFBQSxRQUFRLENBQUMsVUFBRCxFQUFhLFlBQU07QUFDekJVLElBQUFBLEVBQUUsQ0FBQyx1QkFBRCxFQUEwQixZQUFNO0FBQ2hDQyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV1gsRUFBWCxFQUFlLFdBQWY7QUFFQUEsTUFBQUEsRUFB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LWRpc2FibGUgbm8tdW51c2VkLWV4cHJlc3Npb25zICovXG5cbmltcG9ydCBJbWFwQ2xpZW50LCB7IFNUQVRFX1NFTEVDVEVELCBTVEFURV9MT0dPVVQgfSBmcm9tICcuL2NsaWVudCdcbmltcG9ydCB7IHBhcnNlciB9IGZyb20gJ2VtYWlsanMtaW1hcC1oYW5kbGVyJ1xuaW1wb3J0IHtcbiAgdG9UeXBlZEFycmF5LFxuICBMT0dfTEVWRUxfTk9ORSBhcyBsb2dMZXZlbFxufSBmcm9tICcuL2NvbW1vbidcblxuZGVzY3JpYmUoJ2Jyb3dzZXJib3ggdW5pdCB0ZXN0cycsICgpID0+IHtcbiAgdmFyIGJyXG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgY29uc3QgYXV0aCA9IHsgdXNlcjogJ2JhbGRyaWFuJywgcGFzczogJ3NsZWVwZXIuZGUnIH1cbiAgICBiciA9IG5ldyBJbWFwQ2xpZW50KCdzb21laG9zdCcsIDEyMzQsIHsgYXV0aCwgbG9nTGV2ZWwgfSlcbiAgICBici5jbGllbnQuc29ja2V0ID0ge1xuICAgICAgc2VuZDogKCkgPT4geyB9LFxuICAgICAgdXBncmFkZVRvU2VjdXJlOiAoKSA9PiB7IH1cbiAgICB9XG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNfb25JZGxlJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY2FsbCBlbnRlcklkbGUnLCAoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZW50ZXJJZGxlJylcblxuICAgICAgYnIuX2F1dGhlbnRpY2F0ZWQgPSB0cnVlXG4gICAgICBici5fZW50ZXJlZElkbGUgPSBmYWxzZVxuICAgICAgYnIuX29uSWRsZSgpXG5cbiAgICAgIGV4cGVjdChici5lbnRlcklkbGUuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG5vdCBjYWxsIGVudGVySWRsZScsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdlbnRlcklkbGUnKVxuXG4gICAgICBici5fZW50ZXJlZElkbGUgPSB0cnVlXG4gICAgICBici5fb25JZGxlKClcblxuICAgICAgZXhwZWN0KGJyLmVudGVySWRsZS5jYWxsQ291bnQpLnRvLmVxdWFsKDApXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI29wZW5Db25uZWN0aW9uJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc2lub24uc3R1Yihici5jbGllbnQsICdjb25uZWN0JylcbiAgICAgIHNpbm9uLnN0dWIoYnIuY2xpZW50LCAnY2xvc2UnKVxuICAgICAgc2lub24uc3R1Yihici5jbGllbnQsICdlbnF1ZXVlQ29tbWFuZCcpXG4gICAgfSlcbiAgICBpdCgnc2hvdWxkIG9wZW4gY29ubmVjdGlvbicsICgpID0+IHtcbiAgICAgIGJyLmNsaWVudC5jb25uZWN0LnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgICBici5jbGllbnQuZW5xdWV1ZUNvbW1hbmQucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBjYXBhYmlsaXR5OiBbJ2NhcGExJywgJ2NhcGEyJ11cbiAgICAgIH0pKVxuICAgICAgc2V0VGltZW91dCgoKSA9PiBici5jbGllbnQub25yZWFkeSgpLCAwKVxuICAgICAgcmV0dXJuIGJyLm9wZW5Db25uZWN0aW9uKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5jbGllbnQuY29ubmVjdC5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICAgIGV4cGVjdChici5jbGllbnQuZW5xdWV1ZUNvbW1hbmQuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3QoYnIuX2NhcGFiaWxpdHkubGVuZ3RoKS50by5lcXVhbCgyKVxuICAgICAgICBleHBlY3QoYnIuX2NhcGFiaWxpdHlbMF0pLnRvLmVxdWFsKCdjYXBhMScpXG4gICAgICAgIGV4cGVjdChici5fY2FwYWJpbGl0eVsxXSkudG8uZXF1YWwoJ2NhcGEyJylcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI2Nvbm5lY3QnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLmNsaWVudCwgJ2Nvbm5lY3QnKVxuICAgICAgc2lub24uc3R1Yihici5jbGllbnQsICdjbG9zZScpXG4gICAgICBzaW5vbi5zdHViKGJyLCAndXBkYXRlQ2FwYWJpbGl0eScpXG4gICAgICBzaW5vbi5zdHViKGJyLCAndXBncmFkZUNvbm5lY3Rpb24nKVxuICAgICAgc2lub24uc3R1YihiciwgJ3VwZGF0ZUlkJylcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdsb2dpbicpXG4gICAgICBzaW5vbi5zdHViKGJyLCAnY29tcHJlc3NDb25uZWN0aW9uJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjb25uZWN0JywgKCkgPT4ge1xuICAgICAgYnIuY2xpZW50LmNvbm5lY3QucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcbiAgICAgIGJyLnVwZGF0ZUNhcGFiaWxpdHkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcbiAgICAgIGJyLnVwZ3JhZGVDb25uZWN0aW9uLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgICBici51cGRhdGVJZC5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuICAgICAgYnIubG9naW4ucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcbiAgICAgIGJyLmNvbXByZXNzQ29ubmVjdGlvbi5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IGJyLmNsaWVudC5vbnJlYWR5KCksIDApXG4gICAgICByZXR1cm4gYnIuY29ubmVjdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuY2xpZW50LmNvbm5lY3QuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3QoYnIudXBkYXRlQ2FwYWJpbGl0eS5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICAgIGV4cGVjdChici51cGdyYWRlQ29ubmVjdGlvbi5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICAgIGV4cGVjdChici51cGRhdGVJZC5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICAgIGV4cGVjdChici5sb2dpbi5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICAgIGV4cGVjdChici5jb21wcmVzc0Nvbm5lY3Rpb24uY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBmYWlsIHRvIGxvZ2luJywgKGRvbmUpID0+IHtcbiAgICAgIGJyLmNsaWVudC5jb25uZWN0LnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgICBici51cGRhdGVDYXBhYmlsaXR5LnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgICBici51cGdyYWRlQ29ubmVjdGlvbi5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuICAgICAgYnIudXBkYXRlSWQucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcbiAgICAgIGJyLmxvZ2luLnRocm93cyhuZXcgRXJyb3IoKSlcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiBici5jbGllbnQub25yZWFkeSgpLCAwKVxuICAgICAgYnIuY29ubmVjdCgpLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgZXhwZWN0KGVycikudG8uZXhpc3RcblxuICAgICAgICBleHBlY3QoYnIuY2xpZW50LmNvbm5lY3QuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3QoYnIuY2xpZW50LmNsb3NlLmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KGJyLnVwZGF0ZUNhcGFiaWxpdHkuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3QoYnIudXBncmFkZUNvbm5lY3Rpb24uY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3QoYnIudXBkYXRlSWQuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3QoYnIubG9naW4uY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuXG4gICAgICAgIGV4cGVjdChici5jb21wcmVzc0Nvbm5lY3Rpb24uY2FsbGVkKS50by5iZS5mYWxzZVxuXG4gICAgICAgIGRvbmUoKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCB0aW1lb3V0JywgKGRvbmUpID0+IHtcbiAgICAgIGJyLmNsaWVudC5jb25uZWN0LnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgICBici50aW1lb3V0Q29ubmVjdGlvbiA9IDFcblxuICAgICAgYnIuY29ubmVjdCgpLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgZXhwZWN0KGVycikudG8uZXhpc3RcblxuICAgICAgICBleHBlY3QoYnIuY2xpZW50LmNvbm5lY3QuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3QoYnIuY2xpZW50LmNsb3NlLmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcblxuICAgICAgICBleHBlY3QoYnIudXBkYXRlQ2FwYWJpbGl0eS5jYWxsZWQpLnRvLmJlLmZhbHNlXG4gICAgICAgIGV4cGVjdChici51cGdyYWRlQ29ubmVjdGlvbi5jYWxsZWQpLnRvLmJlLmZhbHNlXG4gICAgICAgIGV4cGVjdChici51cGRhdGVJZC5jYWxsZWQpLnRvLmJlLmZhbHNlXG4gICAgICAgIGV4cGVjdChici5sb2dpbi5jYWxsZWQpLnRvLmJlLmZhbHNlXG4gICAgICAgIGV4cGVjdChici5jb21wcmVzc0Nvbm5lY3Rpb24uY2FsbGVkKS50by5iZS5mYWxzZVxuXG4gICAgICAgIGRvbmUoKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjY2xvc2UnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBmb3JjZS1jbG9zZScsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIuY2xpZW50LCAnY2xvc2UnKS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuXG4gICAgICByZXR1cm4gYnIuY2xvc2UoKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLl9zdGF0ZSkudG8uZXF1YWwoU1RBVEVfTE9HT1VUKVxuICAgICAgICBleHBlY3QoYnIuY2xpZW50LmNsb3NlLmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI2V4ZWMnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnYnJlYWtJZGxlJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzZW5kIHN0cmluZyBjb21tYW5kJywgKCkgPT4ge1xuICAgICAgc2lub24uc3R1Yihici5jbGllbnQsICdlbnF1ZXVlQ29tbWFuZCcpLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHt9KSlcbiAgICAgIHJldHVybiBici5leGVjKCdURVNUJykudGhlbigocmVzKSA9PiB7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvLmRlZXAuZXF1YWwoe30pXG4gICAgICAgIGV4cGVjdChici5jbGllbnQuZW5xdWV1ZUNvbW1hbmQuYXJnc1swXVswXSkudG8uZXF1YWwoJ1RFU1QnKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCB1cGRhdGUgY2FwYWJpbGl0eSBmcm9tIHJlc3BvbnNlJywgKCkgPT4ge1xuICAgICAgc2lub24uc3R1Yihici5jbGllbnQsICdlbnF1ZXVlQ29tbWFuZCcpLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgY2FwYWJpbGl0eTogWydBJywgJ0InXVxuICAgICAgfSkpXG4gICAgICByZXR1cm4gYnIuZXhlYygnVEVTVCcpLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICBleHBlY3QocmVzKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgICBjYXBhYmlsaXR5OiBbJ0EnLCAnQiddXG4gICAgICAgIH0pXG4gICAgICAgIGV4cGVjdChici5fY2FwYWJpbGl0eSkudG8uZGVlcC5lcXVhbChbJ0EnLCAnQiddKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjZW50ZXJJZGxlJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcGVyaW9kaWNhbGx5IHNlbmQgTk9PUCBpZiBJRExFIG5vdCBzdXBwb3J0ZWQnLCAoZG9uZSkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ2V4ZWMnKS5jYWxsc0Zha2UoKGNvbW1hbmQpID0+IHtcbiAgICAgICAgZXhwZWN0KGNvbW1hbmQpLnRvLmVxdWFsKCdOT09QJylcblxuICAgICAgICBkb25lKClcbiAgICAgIH0pXG5cbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gW11cbiAgICAgIGJyLl9zZWxlY3RlZE1haWxib3ggPSAnRk9PJ1xuICAgICAgYnIudGltZW91dE5vb3AgPSAxXG4gICAgICBici5lbnRlcklkbGUoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHBlcmlvZGljYWxseSBzZW5kIE5PT1AgaWYgbm8gbWFpbGJveCBzZWxlY3RlZCcsIChkb25lKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpLmNhbGxzRmFrZSgoY29tbWFuZCkgPT4ge1xuICAgICAgICBleHBlY3QoY29tbWFuZCkudG8uZXF1YWwoJ05PT1AnKVxuXG4gICAgICAgIGRvbmUoKVxuICAgICAgfSlcblxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ0lETEUnXVxuICAgICAgYnIuX3NlbGVjdGVkTWFpbGJveCA9IHVuZGVmaW5lZFxuICAgICAgYnIudGltZW91dE5vb3AgPSAxXG4gICAgICBici5lbnRlcklkbGUoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGJyZWFrIElETEUgYWZ0ZXIgdGltZW91dCcsIChkb25lKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLmNsaWVudCwgJ2VucXVldWVDb21tYW5kJylcbiAgICAgIHNpbm9uLnN0dWIoYnIuY2xpZW50LnNvY2tldCwgJ3NlbmQnKS5jYWxsc0Zha2UoKHBheWxvYWQpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmNsaWVudC5lbnF1ZXVlQ29tbWFuZC5hcmdzWzBdWzBdLmNvbW1hbmQpLnRvLmVxdWFsKCdJRExFJylcbiAgICAgICAgZXhwZWN0KFtdLnNsaWNlLmNhbGwobmV3IFVpbnQ4QXJyYXkocGF5bG9hZCkpKS50by5kZWVwLmVxdWFsKFsweDQ0LCAweDRmLCAweDRlLCAweDQ1LCAweDBkLCAweDBhXSlcblxuICAgICAgICBkb25lKClcbiAgICAgIH0pXG5cbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gWydJRExFJ11cbiAgICAgIGJyLl9zZWxlY3RlZE1haWxib3ggPSAnRk9PJ1xuICAgICAgYnIudGltZW91dElkbGUgPSAxXG4gICAgICBici5lbnRlcklkbGUoKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNicmVha0lkbGUnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzZW5kIERPTkUgdG8gc29ja2V0JywgKCkgPT4ge1xuICAgICAgc2lub24uc3R1Yihici5jbGllbnQuc29ja2V0LCAnc2VuZCcpXG5cbiAgICAgIGJyLl9lbnRlcmVkSWRsZSA9ICdJRExFJ1xuICAgICAgYnIuYnJlYWtJZGxlKClcbiAgICAgIGV4cGVjdChbXS5zbGljZS5jYWxsKG5ldyBVaW50OEFycmF5KGJyLmNsaWVudC5zb2NrZXQuc2VuZC5hcmdzWzBdWzBdKSkpLnRvLmRlZXAuZXF1YWwoWzB4NDQsIDB4NGYsIDB4NGUsIDB4NDUsIDB4MGQsIDB4MGFdKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyN1cGdyYWRlQ29ubmVjdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGRvIG5vdGhpbmcgaWYgYWxyZWFkeSBzZWN1cmVkJywgKCkgPT4ge1xuICAgICAgYnIuY2xpZW50LnNlY3VyZU1vZGUgPSB0cnVlXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnc3RhcnR0bHMnXVxuICAgICAgcmV0dXJuIGJyLnVwZ3JhZGVDb25uZWN0aW9uKClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBkbyBub3RoaW5nIGlmIFNUQVJUVExTIG5vdCBhdmFpbGFibGUnLCAoKSA9PiB7XG4gICAgICBici5jbGllbnQuc2VjdXJlTW9kZSA9IGZhbHNlXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFtdXG4gICAgICByZXR1cm4gYnIudXBncmFkZUNvbm5lY3Rpb24oKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJ1biBTVEFSVFRMUycsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIuY2xpZW50LCAndXBncmFkZScpXG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpLndpdGhBcmdzKCdTVEFSVFRMUycpLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgICBzaW5vbi5zdHViKGJyLCAndXBkYXRlQ2FwYWJpbGl0eScpLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gWydTVEFSVFRMUyddXG5cbiAgICAgIHJldHVybiBici51cGdyYWRlQ29ubmVjdGlvbigpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuY2xpZW50LnVwZ3JhZGUuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoYnIuX2NhcGFiaWxpdHkubGVuZ3RoKS50by5lcXVhbCgwKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjdXBkYXRlQ2FwYWJpbGl0eScsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBkbyBub3RoaW5nIGlmIGNhcGFiaWxpdHkgaXMgc2V0JywgKCkgPT4ge1xuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ2FiYyddXG4gICAgICByZXR1cm4gYnIudXBkYXRlQ2FwYWJpbGl0eSgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcnVuIENBUEFCSUxJVFkgaWYgY2FwYWJpbGl0eSBub3Qgc2V0JywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFtdXG5cbiAgICAgIHJldHVybiBici51cGRhdGVDYXBhYmlsaXR5KCkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmFyZ3NbMF1bMF0pLnRvLmVxdWFsKCdDQVBBQklMSVRZJylcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZm9yY2UgcnVuIENBUEFCSUxJVFknLCAoKSA9PiB7XG4gICAgICBici5leGVjLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnYWJjJ11cblxuICAgICAgcmV0dXJuIGJyLnVwZGF0ZUNhcGFiaWxpdHkodHJ1ZSkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmFyZ3NbMF1bMF0pLnRvLmVxdWFsKCdDQVBBQklMSVRZJylcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZG8gbm90aGluZyBpZiBjb25uZWN0aW9uIGlzIG5vdCB5ZXQgdXBncmFkZWQnLCAoKSA9PiB7XG4gICAgICBici5fY2FwYWJpbGl0eSA9IFtdXG4gICAgICBici5jbGllbnQuc2VjdXJlTW9kZSA9IGZhbHNlXG4gICAgICBici5fcmVxdWlyZVRMUyA9IHRydWVcblxuICAgICAgYnIudXBkYXRlQ2FwYWJpbGl0eSgpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI2xpc3ROYW1lc3BhY2VzJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ2V4ZWMnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJ1biBOQU1FU1BBQ0UgaWYgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICBOQU1FU1BBQ0U6IFt7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiBbXG4gICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICBbe1xuICAgICAgICAgICAgICAgICAgdHlwZTogJ1NUUklORycsXG4gICAgICAgICAgICAgICAgICB2YWx1ZTogJ0lOQk9YLidcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiAnU1RSSU5HJyxcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiAnLidcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICBdLCBudWxsLCBudWxsXG4gICAgICAgICAgICBdXG4gICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgICAgfSkpXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnTkFNRVNQQUNFJ11cblxuICAgICAgcmV0dXJuIGJyLmxpc3ROYW1lc3BhY2VzKCkudGhlbigobmFtZXNwYWNlcykgPT4ge1xuICAgICAgICBleHBlY3QobmFtZXNwYWNlcykudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgICAgcGVyc29uYWw6IFt7XG4gICAgICAgICAgICBwcmVmaXg6ICdJTkJPWC4nLFxuICAgICAgICAgICAgZGVsaW1pdGVyOiAnLidcbiAgICAgICAgICB9XSxcbiAgICAgICAgICB1c2VyczogZmFsc2UsXG4gICAgICAgICAgc2hhcmVkOiBmYWxzZVxuICAgICAgICB9KVxuICAgICAgICBleHBlY3QoYnIuZXhlYy5hcmdzWzBdWzBdKS50by5lcXVhbCgnTkFNRVNQQUNFJylcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuYXJnc1swXVsxXSkudG8uZXF1YWwoJ05BTUVTUEFDRScpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGRvIG5vdGhpbmcgaWYgbm90IHN1cHBvcnRlZCcsICgpID0+IHtcbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gW11cbiAgICAgIHJldHVybiBici5saXN0TmFtZXNwYWNlcygpLnRoZW4oKG5hbWVzcGFjZXMpID0+IHtcbiAgICAgICAgZXhwZWN0KG5hbWVzcGFjZXMpLnRvLmJlLmZhbHNlXG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMClcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI2NvbXByZXNzQ29ubmVjdGlvbicsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICAgIHNpbm9uLnN0dWIoYnIuY2xpZW50LCAnZW5hYmxlQ29tcHJlc3Npb24nKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJ1biBDT01QUkVTUz1ERUZMQVRFIGlmIHN1cHBvcnRlZCcsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnQ09NUFJFU1MnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgICB2YWx1ZTogJ0RFRkxBVEUnXG4gICAgICAgIH1dXG4gICAgICB9KS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh7fSkpXG5cbiAgICAgIGJyLl9lbmFibGVDb21wcmVzc2lvbiA9IHRydWVcbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gWydDT01QUkVTUz1ERUZMQVRFJ11cbiAgICAgIHJldHVybiBici5jb21wcmVzc0Nvbm5lY3Rpb24oKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoYnIuY2xpZW50LmVuYWJsZUNvbXByZXNzaW9uLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZG8gbm90aGluZyBpZiBub3Qgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbXVxuXG4gICAgICByZXR1cm4gYnIuY29tcHJlc3NDb25uZWN0aW9uKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZG8gbm90aGluZyBpZiBub3QgZW5hYmxlZCcsICgpID0+IHtcbiAgICAgIGJyLl9lbmFibGVDb21wcmVzc2lvbiA9IGZhbHNlXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnQ09NUFJFU1M9REVGTEFURSddXG5cbiAgICAgIHJldHVybiBici5jb21wcmVzc0Nvbm5lY3Rpb24oKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgwKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjbG9naW4nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIExPR0lOJywgKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ2V4ZWMnKS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh7fSkpXG4gICAgICBzaW5vbi5zdHViKGJyLCAndXBkYXRlQ2FwYWJpbGl0eScpLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHRydWUpKVxuXG4gICAgICByZXR1cm4gYnIubG9naW4oe1xuICAgICAgICB1c2VyOiAndTEnLFxuICAgICAgICBwYXNzOiAncDEnXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoYnIuZXhlYy5hcmdzWzBdWzBdKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgICBjb21tYW5kOiAnbG9naW4nLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgICAgICB0eXBlOiAnU1RSSU5HJyxcbiAgICAgICAgICAgIHZhbHVlOiAndTEnXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgdHlwZTogJ1NUUklORycsXG4gICAgICAgICAgICB2YWx1ZTogJ3AxJyxcbiAgICAgICAgICAgIHNlbnNpdGl2ZTogdHJ1ZVxuICAgICAgICAgIH1dXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNhbGwgWE9BVVRIMicsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJykucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe30pKVxuICAgICAgc2lub24uc3R1YihiciwgJ3VwZGF0ZUNhcGFiaWxpdHknKS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh0cnVlKSlcblxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ0FVVEg9WE9BVVRIMiddXG4gICAgICBici5sb2dpbih7XG4gICAgICAgIHVzZXI6ICd1MScsXG4gICAgICAgIHhvYXV0aDI6ICdhYmMnXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoYnIuZXhlYy5hcmdzWzBdWzBdKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgICBjb21tYW5kOiAnQVVUSEVOVElDQVRFJyxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICAgICAgdHlwZTogJ0FUT00nLFxuICAgICAgICAgICAgdmFsdWU6ICdYT0FVVEgyJ1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgICAgIHZhbHVlOiAnZFhObGNqMTFNUUZoZFhSb1BVSmxZWEpsY2lCaFltTUJBUT09JyxcbiAgICAgICAgICAgIHNlbnNpdGl2ZTogdHJ1ZVxuICAgICAgICAgIH1dXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyN1cGRhdGVJZCcsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBub3Qgbm90aGluZyBpZiBub3Qgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbXVxuXG4gICAgICByZXR1cm4gYnIudXBkYXRlSWQoe1xuICAgICAgICBhOiAnYicsXG4gICAgICAgIGM6ICdkJ1xuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5zZXJ2ZXJJZCkudG8uYmUuZmFsc2VcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc2VuZCBOSUwnLCAoKSA9PiB7XG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ0lEJyxcbiAgICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICAgIG51bGxcbiAgICAgICAgXVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgSUQ6IFt7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiBbXG4gICAgICAgICAgICAgIG51bGxcbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XVxuICAgICAgICB9XG4gICAgICB9KSlcbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gWydJRCddXG5cbiAgICAgIHJldHVybiBici51cGRhdGVJZChudWxsKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLnNlcnZlcklkKS50by5kZWVwLmVxdWFsKHt9KVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBleGhhbmdlIElEIHZhbHVlcycsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnSUQnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbXG4gICAgICAgICAgWydja2V5MScsICdjdmFsMScsICdja2V5MicsICdjdmFsMiddXG4gICAgICAgIF1cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgIElEOiBbe1xuICAgICAgICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICAgICAgICBbe1xuICAgICAgICAgICAgICAgIHZhbHVlOiAnc2tleTEnXG4gICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ3N2YWwxJ1xuICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdmFsdWU6ICdza2V5MidcbiAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHZhbHVlOiAnc3ZhbDInXG4gICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICBdXG4gICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgICAgfSkpXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnSUQnXVxuXG4gICAgICByZXR1cm4gYnIudXBkYXRlSWQoe1xuICAgICAgICBja2V5MTogJ2N2YWwxJyxcbiAgICAgICAgY2tleTI6ICdjdmFsMidcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuc2VydmVySWQpLnRvLmRlZXAuZXF1YWwoe1xuICAgICAgICAgIHNrZXkxOiAnc3ZhbDEnLFxuICAgICAgICAgIHNrZXkyOiAnc3ZhbDInXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNsaXN0TWFpbGJveGVzJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ2V4ZWMnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNhbGwgTElTVCBhbmQgTFNVQiBpbiBzZXF1ZW5jZScsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnTElTVCcsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFsnJywgJyonXVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgTElTVDogW2ZhbHNlXVxuICAgICAgICB9XG4gICAgICB9KSlcblxuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdMU1VCJyxcbiAgICAgICAgYXR0cmlidXRlczogWycnLCAnKiddXG4gICAgICB9KS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICBMU1VCOiBbZmFsc2VdXG4gICAgICAgIH1cbiAgICAgIH0pKVxuXG4gICAgICByZXR1cm4gYnIubGlzdE1haWxib3hlcygpLnRoZW4oKHRyZWUpID0+IHtcbiAgICAgICAgZXhwZWN0KHRyZWUpLnRvLmV4aXN0XG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG5vdCBkaWUgb24gTklMIHNlcGFyYXRvcnMnLCAoKSA9PiB7XG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ0xJU1QnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbJycsICcqJ11cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgIExJU1Q6IFtcbiAgICAgICAgICAgIHBhcnNlcih0b1R5cGVkQXJyYXkoJyogTElTVCAoXFxcXE5vSW5mZXJpb3JzKSBOSUwgXCJJTkJPWFwiJykpXG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICB9KSlcblxuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdMU1VCJyxcbiAgICAgICAgYXR0cmlidXRlczogWycnLCAnKiddXG4gICAgICB9KS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICBMU1VCOiBbXG4gICAgICAgICAgICBwYXJzZXIodG9UeXBlZEFycmF5KCcqIExTVUIgKFxcXFxOb0luZmVyaW9ycykgTklMIFwiSU5CT1hcIicpKVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfSkpXG5cbiAgICAgIHJldHVybiBici5saXN0TWFpbGJveGVzKCkudGhlbigodHJlZSkgPT4ge1xuICAgICAgICBleHBlY3QodHJlZSkudG8uZXhpc3RcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI2NyZWF0ZU1haWxib3gnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY2FsbCBDUkVBVEUgd2l0aCBhIHN0cmluZyBwYXlsb2FkJywgKCkgPT4ge1xuICAgICAgLy8gVGhlIHNwZWMgYWxsb3dzIHVucXVvdGVkIEFUT00tc3R5bGUgc3ludGF4IHRvbywgYnV0IGZvclxuICAgICAgLy8gc2ltcGxpY2l0eSB3ZSBhbHdheXMgZ2VuZXJhdGUgYSBzdHJpbmcgZXZlbiBpZiBpdCBjb3VsZCBiZVxuICAgICAgLy8gZXhwcmVzc2VkIGFzIGFuIGF0b20uXG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ0NSRUFURScsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFsnbWFpbGJveG5hbWUnXVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgcmV0dXJuIGJyLmNyZWF0ZU1haWxib3goJ21haWxib3huYW1lJykudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY2FsbCBtdXRmNyBlbmNvZGUgdGhlIGFyZ3VtZW50JywgKCkgPT4ge1xuICAgICAgLy8gRnJvbSBSRkMgMzUwMVxuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdDUkVBVEUnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbJ35wZXRlci9tYWlsLyZVLEJURnctLyZaZVZuTElxZS0nXVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgcmV0dXJuIGJyLmNyZWF0ZU1haWxib3goJ35wZXRlci9tYWlsL1xcdTUzZjBcXHU1MzE3L1xcdTY1ZTVcXHU2NzJjXFx1OGE5ZScpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHRyZWF0IGFuIEFMUkVBRFlFWElTVFMgcmVzcG9uc2UgYXMgc3VjY2VzcycsICgpID0+IHtcbiAgICAgIHZhciBmYWtlRXJyID0ge1xuICAgICAgICBjb2RlOiAnQUxSRUFEWUVYSVNUUydcbiAgICAgIH1cbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnQ1JFQVRFJyxcbiAgICAgICAgYXR0cmlidXRlczogWydtYWlsYm94bmFtZSddXG4gICAgICB9KS5yZXR1cm5zKFByb21pc2UucmVqZWN0KGZha2VFcnIpKVxuXG4gICAgICByZXR1cm4gYnIuY3JlYXRlTWFpbGJveCgnbWFpbGJveG5hbWUnKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjZGVsZXRlTWFpbGJveCcsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIERFTEVURSB3aXRoIGEgc3RyaW5nIHBheWxvYWQnLCAoKSA9PiB7XG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ0RFTEVURScsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFsnbWFpbGJveG5hbWUnXVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgcmV0dXJuIGJyLmRlbGV0ZU1haWxib3goJ21haWxib3huYW1lJykudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY2FsbCBtdXRmNyBlbmNvZGUgdGhlIGFyZ3VtZW50JywgKCkgPT4ge1xuICAgICAgLy8gRnJvbSBSRkMgMzUwMVxuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdERUxFVEUnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbJ35wZXRlci9tYWlsLyZVLEJURnctLyZaZVZuTElxZS0nXVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgcmV0dXJuIGJyLmRlbGV0ZU1haWxib3goJ35wZXRlci9tYWlsL1xcdTUzZjBcXHU1MzE3L1xcdTY1ZTVcXHU2NzJjXFx1OGE5ZScpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUuc2tpcCgnI2xpc3RNZXNzYWdlcycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdfYnVpbGRGRVRDSENvbW1hbmQnKVxuICAgICAgc2lub24uc3R1YihiciwgJ19wYXJzZUZFVENIJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIEZFVENIJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgnYWJjJykpXG4gICAgICBici5fYnVpbGRGRVRDSENvbW1hbmQud2l0aEFyZ3MoWycxOjInLCBbJ3VpZCcsICdmbGFncyddLCB7XG4gICAgICAgIGJ5VWlkOiB0cnVlXG4gICAgICB9XSkucmV0dXJucyh7fSlcblxuICAgICAgcmV0dXJuIGJyLmxpc3RNZXNzYWdlcygnSU5CT1gnLCAnMToyJywgWyd1aWQnLCAnZmxhZ3MnXSwge1xuICAgICAgICBieVVpZDogdHJ1ZVxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5fYnVpbGRGRVRDSENvbW1hbmQuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoYnIuX3BhcnNlRkVUQ0gud2l0aEFyZ3MoJ2FiYycpLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZS5za2lwKCcjc2VhcmNoJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ2V4ZWMnKVxuICAgICAgc2lub24uc3R1YihiciwgJ19idWlsZFNFQVJDSENvbW1hbmQnKVxuICAgICAgc2lub24uc3R1YihiciwgJ19wYXJzZVNFQVJDSCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY2FsbCBTRUFSQ0gnLCAoKSA9PiB7XG4gICAgICBici5leGVjLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCdhYmMnKSlcbiAgICAgIGJyLl9idWlsZFNFQVJDSENvbW1hbmQud2l0aEFyZ3Moe1xuICAgICAgICB1aWQ6IDFcbiAgICAgIH0sIHtcbiAgICAgICAgYnlVaWQ6IHRydWVcbiAgICAgIH0pLnJldHVybnMoe30pXG5cbiAgICAgIHJldHVybiBici5zZWFyY2goJ0lOQk9YJywge1xuICAgICAgICB1aWQ6IDFcbiAgICAgIH0sIHtcbiAgICAgICAgYnlVaWQ6IHRydWVcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuX2J1aWxkU0VBUkNIQ29tbWFuZC5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KGJyLl9wYXJzZVNFQVJDSC53aXRoQXJncygnYWJjJykuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjdXBsb2FkJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ2V4ZWMnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNhbGwgQVBQRU5EIHdpdGggY3VzdG9tIGZsYWcnLCAoKSA9PiB7XG4gICAgICBici5leGVjLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICAgIHJldHVybiBici51cGxvYWQoJ21haWxib3gnLCAndGhpcyBpcyBhIG1lc3NhZ2UnLCB7XG4gICAgICAgIGZsYWdzOiBbJ1xcXFwkTXlGbGFnJ11cbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNhbGwgQVBQRU5EIHcvbyBmbGFncycsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgcmV0dXJuIGJyLnVwbG9hZCgnbWFpbGJveCcsICd0aGlzIGlzIGEgbWVzc2FnZScpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUuc2tpcCgnI3NldEZsYWdzJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ2V4ZWMnKVxuICAgICAgc2lub24uc3R1YihiciwgJ19idWlsZFNUT1JFQ29tbWFuZCcpXG4gICAgICBzaW5vbi5zdHViKGJyLCAnX3BhcnNlRkVUQ0gnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNhbGwgU1RPUkUnLCAoKSA9PiB7XG4gICAgICBici5leGVjLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCdhYmMnKSlcbiAgICAgIGJyLl9idWlsZFNUT1JFQ29tbWFuZC53aXRoQXJncygnMToyJywgJ0ZMQUdTJywgWydcXFxcU2VlbicsICckTXlGbGFnJ10sIHtcbiAgICAgICAgYnlVaWQ6IHRydWVcbiAgICAgIH0pLnJldHVybnMoe30pXG5cbiAgICAgIHJldHVybiBici5zZXRGbGFncygnSU5CT1gnLCAnMToyJywgWydcXFxcU2VlbicsICckTXlGbGFnJ10sIHtcbiAgICAgICAgYnlVaWQ6IHRydWVcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICAgIGV4cGVjdChici5fcGFyc2VGRVRDSC53aXRoQXJncygnYWJjJykuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlLnNraXAoJyNzdG9yZScsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdfYnVpbGRTVE9SRUNvbW1hbmQnKVxuICAgICAgc2lub24uc3R1YihiciwgJ19wYXJzZUZFVENIJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIFNUT1JFJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgnYWJjJykpXG4gICAgICBici5fYnVpbGRTVE9SRUNvbW1hbmQud2l0aEFyZ3MoJzE6MicsICcrWC1HTS1MQUJFTFMnLCBbJ1xcXFxTZW50JywgJ1xcXFxKdW5rJ10sIHtcbiAgICAgICAgYnlVaWQ6IHRydWVcbiAgICAgIH0pLnJldHVybnMoe30pXG5cbiAgICAgIHJldHVybiBici5zdG9yZSgnSU5CT1gnLCAnMToyJywgJytYLUdNLUxBQkVMUycsIFsnXFxcXFNlbnQnLCAnXFxcXEp1bmsnXSwge1xuICAgICAgICBieVVpZDogdHJ1ZVxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5fYnVpbGRTVE9SRUNvbW1hbmQuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICAgIGV4cGVjdChici5fcGFyc2VGRVRDSC53aXRoQXJncygnYWJjJykuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjZGVsZXRlTWVzc2FnZXMnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnc2V0RmxhZ3MnKVxuICAgICAgc2lub24uc3R1YihiciwgJ2V4ZWMnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNhbGwgVUlEIEVYUFVOR0UnLCAoKSA9PiB7XG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ1VJRCBFWFBVTkdFJyxcbiAgICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgICB0eXBlOiAnc2VxdWVuY2UnLFxuICAgICAgICAgIHZhbHVlOiAnMToyJ1xuICAgICAgICB9XVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoJ2FiYycpKVxuICAgICAgYnIuc2V0RmxhZ3Mud2l0aEFyZ3MoJ0lOQk9YJywgJzE6MicsIHtcbiAgICAgICAgYWRkOiAnXFxcXERlbGV0ZWQnXG4gICAgICB9KS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnVUlEUExVUyddXG4gICAgICByZXR1cm4gYnIuZGVsZXRlTWVzc2FnZXMoJ0lOQk9YJywgJzE6MicsIHtcbiAgICAgICAgYnlVaWQ6IHRydWVcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNhbGwgRVhQVU5HRScsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3MoJ0VYUFVOR0UnKS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgnYWJjJykpXG4gICAgICBici5zZXRGbGFncy53aXRoQXJncygnSU5CT1gnLCAnMToyJywge1xuICAgICAgICBhZGQ6ICdcXFxcRGVsZXRlZCdcbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gW11cbiAgICAgIHJldHVybiBici5kZWxldGVNZXNzYWdlcygnSU5CT1gnLCAnMToyJywge1xuICAgICAgICBieVVpZDogdHJ1ZVxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI2NvcHlNZXNzYWdlcycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIENPUFknLCAoKSA9PiB7XG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ1VJRCBDT1BZJyxcbiAgICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgICB0eXBlOiAnc2VxdWVuY2UnLFxuICAgICAgICAgIHZhbHVlOiAnMToyJ1xuICAgICAgICB9LCB7XG4gICAgICAgICAgdHlwZTogJ2F0b20nLFxuICAgICAgICAgIHZhbHVlOiAnW0dtYWlsXS9UcmFzaCdcbiAgICAgICAgfV1cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgY29weXVpZDogWycxJywgJzE6MicsICc0LDMnXVxuICAgICAgfSkpXG5cbiAgICAgIHJldHVybiBici5jb3B5TWVzc2FnZXMoJ0lOQk9YJywgJzE6MicsICdbR21haWxdL1RyYXNoJywge1xuICAgICAgICBieVVpZDogdHJ1ZVxuICAgICAgfSkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgICBzcmNTZXFTZXQ6ICcxOjInLFxuICAgICAgICAgIGRlc3RTZXFTZXQ6ICc0LDMnXG4gICAgICAgIH0pXG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI21vdmVNZXNzYWdlcycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdjb3B5TWVzc2FnZXMnKVxuICAgICAgc2lub24uc3R1YihiciwgJ2RlbGV0ZU1lc3NhZ2VzJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIE1PVkUgaWYgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdVSUQgTU9WRScsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgICAgdHlwZTogJ3NlcXVlbmNlJyxcbiAgICAgICAgICB2YWx1ZTogJzE6MidcbiAgICAgICAgfSwge1xuICAgICAgICAgIHR5cGU6ICdhdG9tJyxcbiAgICAgICAgICB2YWx1ZTogJ1tHbWFpbF0vVHJhc2gnXG4gICAgICAgIH1dXG4gICAgICB9LCBbJ09LJ10pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCdhYmMnKSlcblxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ01PVkUnXVxuICAgICAgcmV0dXJuIGJyLm1vdmVNZXNzYWdlcygnSU5CT1gnLCAnMToyJywgJ1tHbWFpbF0vVHJhc2gnLCB7XG4gICAgICAgIGJ5VWlkOiB0cnVlXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBmYWxsYmFjayB0byBjb3B5K2V4cHVuZ2UnLCAoKSA9PiB7XG4gICAgICBici5jb3B5TWVzc2FnZXMud2l0aEFyZ3MoJ0lOQk9YJywgJzE6MicsICdbR21haWxdL1RyYXNoJywge1xuICAgICAgICBieVVpZDogdHJ1ZVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcbiAgICAgIGJyLmRlbGV0ZU1lc3NhZ2VzLndpdGhBcmdzKCcxOjInLCB7XG4gICAgICAgIGJ5VWlkOiB0cnVlXG4gICAgICB9KS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFtdXG4gICAgICByZXR1cm4gYnIubW92ZU1lc3NhZ2VzKCdJTkJPWCcsICcxOjInLCAnW0dtYWlsXS9UcmFzaCcsIHtcbiAgICAgICAgYnlVaWQ6IHRydWVcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZGVsZXRlTWVzc2FnZXMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjX3Nob3VsZFNlbGVjdE1haWxib3gnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIGN0eCBpcyB1bmRlZmluZWQnLCAoKSA9PiB7XG4gICAgICBleHBlY3QoYnIuX3Nob3VsZFNlbGVjdE1haWxib3goJ3BhdGgnKSkudG8uYmUudHJ1ZVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiB0cnVlIHdoZW4gYSBkaWZmZXJlbnQgcGF0aCBpcyBxdWV1ZWQnLCAoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLmNsaWVudCwgJ2dldFByZXZpb3VzbHlRdWV1ZWQnKS5yZXR1cm5zKHtcbiAgICAgICAgcmVxdWVzdDoge1xuICAgICAgICAgIGNvbW1hbmQ6ICdTRUxFQ1QnLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgICAgICB0eXBlOiAnU1RSSU5HJyxcbiAgICAgICAgICAgIHZhbHVlOiAncXVldWVkIHBhdGgnXG4gICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgZXhwZWN0KGJyLl9zaG91bGRTZWxlY3RNYWlsYm94KCdwYXRoJywge30pKS50by5iZS50cnVlXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIGZhbHNlIHdoZW4gdGhlIHNhbWUgcGF0aCBpcyBxdWV1ZWQnLCAoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLmNsaWVudCwgJ2dldFByZXZpb3VzbHlRdWV1ZWQnKS5yZXR1cm5zKHtcbiAgICAgICAgcmVxdWVzdDoge1xuICAgICAgICAgIGNvbW1hbmQ6ICdTRUxFQ1QnLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgICAgICB0eXBlOiAnU1RSSU5HJyxcbiAgICAgICAgICAgIHZhbHVlOiAncXVldWVkIHBhdGgnXG4gICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgZXhwZWN0KGJyLl9zaG91bGRTZWxlY3RNYWlsYm94KCdxdWV1ZWQgcGF0aCcsIHt9KSkudG8uYmUuZmFsc2VcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjc2VsZWN0TWFpbGJveCcsICgpID0+IHtcbiAgICBjb25zdCBwYXRoID0gJ1tHbWFpbF0vVHJhc2gnXG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcnVuIFNFTEVDVCcsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnU0VMRUNUJyxcbiAgICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgICB0eXBlOiAnU1RSSU5HJyxcbiAgICAgICAgICB2YWx1ZTogcGF0aFxuICAgICAgICB9XVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBjb2RlOiAnUkVBRC1XUklURSdcbiAgICAgIH0pKVxuXG4gICAgICByZXR1cm4gYnIuc2VsZWN0TWFpbGJveChwYXRoKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoYnIuX3N0YXRlKS50by5lcXVhbChTVEFURV9TRUxFQ1RFRClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcnVuIFNFTEVDVCB3aXRoIENPTkRTVE9SRScsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnU0VMRUNUJyxcbiAgICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgICB0eXBlOiAnU1RSSU5HJyxcbiAgICAgICAgICB2YWx1ZTogcGF0aFxuICAgICAgICB9LFxuICAgICAgICBbe1xuICAgICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgICB2YWx1ZTogJ0NPTkRTVE9SRSdcbiAgICAgICAgfV1cbiAgICAgICAgXVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBjb2RlOiAnUkVBRC1XUklURSdcbiAgICAgIH0pKVxuXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnQ09ORFNUT1JFJ11cbiAgICAgIHJldHVybiBici5zZWxlY3RNYWlsYm94KHBhdGgsIHtcbiAgICAgICAgY29uZHN0b3JlOiB0cnVlXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoYnIuX3N0YXRlKS50by5lcXVhbChTVEFURV9TRUxFQ1RFRClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGRlc2NyaWJlKCdzaG91bGQgZW1pdCBvbnNlbGVjdG1haWxib3ggYmVmb3JlIHNlbGVjdE1haWxib3ggaXMgcmVzb2x2ZWQnLCAoKSA9PiB7XG4gICAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgICAgYnIuZXhlYy5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgY29kZTogJ1JFQUQtV1JJVEUnXG4gICAgICAgIH0pKVxuICAgICAgfSlcblxuICAgICAgaXQoJ3doZW4gaXQgcmV0dXJucyBhIHByb21pc2UnLCAoKSA9PiB7XG4gICAgICAgIHZhciBwcm9taXNlUmVzb2x2ZWQgPSBmYWxzZVxuICAgICAgICBici5vbnNlbGVjdG1haWxib3ggPSAoKSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgIHByb21pc2VSZXNvbHZlZCA9IHRydWVcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIG9uc2VsZWN0bWFpbGJveFNweSA9IHNpbm9uLnNweShiciwgJ29uc2VsZWN0bWFpbGJveCcpXG4gICAgICAgIHJldHVybiBici5zZWxlY3RNYWlsYm94KHBhdGgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGV4cGVjdChvbnNlbGVjdG1haWxib3hTcHkud2l0aEFyZ3MocGF0aCkuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICAgIGV4cGVjdChwcm9taXNlUmVzb2x2ZWQpLnRvLmVxdWFsKHRydWUpXG4gICAgICAgIH0pXG4gICAgICB9KVxuXG4gICAgICBpdCgnd2hlbiBpdCBkb2VzIG5vdCByZXR1cm4gYSBwcm9taXNlJywgKCkgPT4ge1xuICAgICAgICBici5vbnNlbGVjdG1haWxib3ggPSAoKSA9PiB7IH1cbiAgICAgICAgdmFyIG9uc2VsZWN0bWFpbGJveFNweSA9IHNpbm9uLnNweShiciwgJ29uc2VsZWN0bWFpbGJveCcpXG4gICAgICAgIHJldHVybiBici5zZWxlY3RNYWlsYm94KHBhdGgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGV4cGVjdChvbnNlbGVjdG1haWxib3hTcHkud2l0aEFyZ3MocGF0aCkuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBlbWl0IG9uY2xvc2VtYWlsYm94JywgKCkgPT4ge1xuICAgICAgbGV0IGNhbGxlZCA9IGZhbHNlXG4gICAgICBici5leGVjLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCdhYmMnKSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBjb2RlOiAnUkVBRC1XUklURSdcbiAgICAgIH0pKVxuXG4gICAgICBici5vbmNsb3NlbWFpbGJveCA9IChwYXRoKSA9PiB7XG4gICAgICAgIGV4cGVjdChwYXRoKS50by5lcXVhbCgneXl5JylcbiAgICAgICAgY2FsbGVkID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBici5fc2VsZWN0ZWRNYWlsYm94ID0gJ3l5eSdcbiAgICAgIHJldHVybiBici5zZWxlY3RNYWlsYm94KHBhdGgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoY2FsbGVkKS50by5iZS50cnVlXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNtYWlsYm94U3RhdHVzJywgKCkgPT4ge1xuICAgIGNvbnN0IHBhdGggPSAnSW5ib3gnXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBydW4gU1RBVFVTJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdTVEFUVVMnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbXG4gICAgICAgICAgeyB0eXBlOiAnU1RSSU5HJywgdmFsdWU6IHBhdGggfSxcbiAgICAgICAgICBbXG4gICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICdVSURORVhUJyB9LFxuICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnTUVTU0FHRVMnIH1cbiAgICAgICAgICBdXG4gICAgICAgIF1cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgIFNUQVRVUzogW3tcbiAgICAgICAgICAgIHRhZzogJyonLFxuICAgICAgICAgICAgY29tbWFuZDogJ1NUQVRVUycsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOlxuICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiBwYXRoIH0sXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnVUlETkVYVCcgfSxcbiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJzI4MjQnIH0sXG4gICAgICAgICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICdNRVNTQUdFUycgfSxcbiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJzY3NicgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICAgIH0pKVxuXG4gICAgICByZXR1cm4gYnIubWFpbGJveFN0YXR1cyhwYXRoKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QocmVzdWx0LnVpZE5leHQpLnRvLmVxdWFsKDI4MjQpXG4gICAgICAgIGV4cGVjdChyZXN1bHQubWVzc2FnZXMpLnRvLmVxdWFsKDY3NilcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcnVuIFNUQVRVUyB3aXRoIEhJR0hFU1RNT0RTRVEnLCAoKSA9PiB7XG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnQ09ORFNUT1JFJ11cbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnU1RBVFVTJyxcbiAgICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICAgIHsgdHlwZTogJ1NUUklORycsIHZhbHVlOiBwYXRoIH0sXG4gICAgICAgICAgW1xuICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnVUlETkVYVCcgfSxcbiAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ01FU1NBR0VTJyB9LFxuICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnSElHSEVTVE1PRFNFUScgfVxuICAgICAgICAgIF1cbiAgICAgICAgXVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgU1RBVFVTOiBbe1xuICAgICAgICAgICAgdGFnOiAnKicsXG4gICAgICAgICAgICBjb21tYW5kOiAnU1RBVFVTJyxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6XG4gICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6IHBhdGggfSxcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICdVSURORVhUJyB9LFxuICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnMjgyNCcgfSxcbiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ01FU1NBR0VTJyB9LFxuICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnNjc2JyB9LFxuICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnSElHSEVTVE1PRFNFUScgfSxcbiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJzEwJyB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgICAgfSkpXG5cbiAgICAgIHJldHVybiBici5tYWlsYm94U3RhdHVzKHBhdGgsIHsgY29uZHN0b3JlOiB0cnVlIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICAgIGV4cGVjdChyZXN1bHQudWlkTmV4dCkudG8uZXF1YWwoMjgyNClcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5tZXNzYWdlcykudG8uZXF1YWwoNjc2KVxuICAgICAgICBleHBlY3QocmVzdWx0LmhpZ2hlc3RNb2RzZXEpLnRvLmVxdWFsKDEwKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBydW4gU1RBVFVTIHdpdGggaW52YWxpZCByZXN1bHQnLCAoKSA9PiB7XG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ1NUQVRVUycsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFtcbiAgICAgICAgICB7IHR5cGU6ICdTVFJJTkcnLCB2YWx1ZTogcGF0aCB9LFxuICAgICAgICAgIFtcbiAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ1VJRE5FWFQnIH0sXG4gICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICdNRVNTQUdFUycgfVxuICAgICAgICAgIF1cbiAgICAgICAgXVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgU1RBVFVTOiBbe1xuICAgICAgICAgICAgdGFnOiAnKicsXG4gICAgICAgICAgICBjb21tYW5kOiAnU1RBVFVTJyxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6XG4gICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6IHBhdGggfSxcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICdVSURORVhUJyB9LFxuICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAneW91eW91JyB9LFxuICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnTUVTU0FHRVNfaW52YWxpZCcgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICAgIH0pKVxuXG4gICAgICByZXR1cm4gYnIubWFpbGJveFN0YXR1cyhwYXRoKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QocmVzdWx0LnVpZE5leHQpLnRvLmVxdWFsKG51bGwpXG4gICAgICAgIGV4cGVjdChyZXN1bHQubWVzc2FnZXMpLnRvLmVxdWFsKG51bGwpXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNoYXNDYXBhYmlsaXR5JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZGV0ZWN0IGV4aXN0aW5nIGNhcGFiaWxpdHknLCAoKSA9PiB7XG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnWlpaJ11cbiAgICAgIGV4cGVjdChici5oYXNDYXBhYmlsaXR5KCd6enonKSkudG8uYmUudHJ1ZVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGRldGVjdCBub24gZXhpc3RpbmcgY2FwYWJpbGl0eScsICgpID0+IHtcbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gWydaWlonXVxuICAgICAgZXhwZWN0KGJyLmhhc0NhcGFiaWxpdHkoJ29vbycpKS50by5iZS5mYWxzZVxuICAgICAgZXhwZWN0KGJyLmhhc0NhcGFiaWxpdHkoKSkudG8uYmUuZmFsc2VcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjX3VudGFnZ2VkT2tIYW5kbGVyJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgdXBkYXRlIGNhcGFiaWxpdHkgaWYgcHJlc2VudCcsICgpID0+IHtcbiAgICAgIGJyLl91bnRhZ2dlZE9rSGFuZGxlcih7XG4gICAgICAgIGNhcGFiaWxpdHk6IFsnYWJjJ11cbiAgICAgIH0sICgpID0+IHsgfSlcbiAgICAgIGV4cGVjdChici5fY2FwYWJpbGl0eSkudG8uZGVlcC5lcXVhbChbJ2FiYyddKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNfdW50YWdnZWRDYXBhYmlsaXR5SGFuZGxlcicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSBjYXBhYmlsaXR5JywgKCkgPT4ge1xuICAgICAgYnIuX3VudGFnZ2VkQ2FwYWJpbGl0eUhhbmRsZXIoe1xuICAgICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICAgIHZhbHVlOiAnYWJjJ1xuICAgICAgICB9XVxuICAgICAgfSwgKCkgPT4geyB9KVxuICAgICAgZXhwZWN0KGJyLl9jYXBhYmlsaXR5KS50by5kZWVwLmVxdWFsKFsnQUJDJ10pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI191bnRhZ2dlZEV4aXN0c0hhbmRsZXInLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBlbWl0IG9udXBkYXRlJywgKCkgPT4ge1xuICAgICAgYnIub251cGRhdGUgPSBzaW5vbi5zdHViKClcbiAgICAgIGJyLl9zZWxlY3RlZE1haWxib3ggPSAnRk9PJ1xuXG4gICAgICBici5fdW50YWdnZWRFeGlzdHNIYW5kbGVyKHtcbiAgICAgICAgbnI6IDEyM1xuICAgICAgfSwgKCkgPT4geyB9KVxuICAgICAgZXhwZWN0KGJyLm9udXBkYXRlLndpdGhBcmdzKCdGT08nLCAnZXhpc3RzJywgMTIzKS5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI191bnRhZ2dlZEV4cHVuZ2VIYW5kbGVyJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZW1pdCBvbnVwZGF0ZScsICgpID0+IHtcbiAgICAgIGJyLm9udXBkYXRlID0gc2lub24uc3R1YigpXG4gICAgICBici5fc2VsZWN0ZWRNYWlsYm94ID0gJ0ZPTydcblxuICAgICAgYnIuX3VudGFnZ2VkRXhwdW5nZUhhbmRsZXIoe1xuICAgICAgICBucjogMTIzXG4gICAgICB9LCAoKSA9PiB7IH0pXG4gICAgICBleHBlY3QoYnIub251cGRhdGUud2l0aEFyZ3MoJ0ZPTycsICdleHB1bmdlJywgMTIzKS5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZS5za2lwKCcjX3VudGFnZ2VkRmV0Y2hIYW5kbGVyJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZW1pdCBvbnVwZGF0ZScsICgpID0+IHtcbiAgICAgIGJyLm9udXBkYXRlID0gc2lub24uc3R1YigpXG4gICAgICBzaW5vbi5zdHViKGJyLCAnX3BhcnNlRkVUQ0gnKS5yZXR1cm5zKCdhYmMnKVxuICAgICAgYnIuX3NlbGVjdGVkTWFpbGJveCA9ICdGT08nXG5cbiAgICAgIGJyLl91bnRhZ2dlZEZldGNoSGFuZGxlcih7XG4gICAgICAgIG5yOiAxMjNcbiAgICAgIH0sICgpID0+IHsgfSlcbiAgICAgIGV4cGVjdChici5vbnVwZGF0ZS53aXRoQXJncygnRk9PJywgJ2ZldGNoJywgJ2FiYycpLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIGV4cGVjdChici5fcGFyc2VGRVRDSC5hcmdzWzBdWzBdKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgIEZFVENIOiBbe1xuICAgICAgICAgICAgbnI6IDEyM1xuICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI19jaGFuZ2VTdGF0ZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHNldCB0aGUgc3RhdGUgdmFsdWUnLCAoKSA9PiB7XG4gICAgICBici5fY2hhbmdlU3RhdGUoMTIzNDUpXG5cbiAgICAgIGV4cGVjdChici5fc3RhdGUpLnRvLmVxdWFsKDEyMzQ1KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGVtaXQgb25jbG9zZW1haWxib3ggaWYgbWFpbGJveCB3YXMgY2xvc2VkJywgKCkgPT4ge1xuICAgICAgYnIub25jbG9zZW1haWxib3ggPSBzaW5vbi5zdHViKClcbiAgICAgIGJyLl9zdGF0ZSA9IFNUQVRFX1NFTEVDVEVEXG4gICAgICBici5fc2VsZWN0ZWRNYWlsYm94ID0gJ2FhYSdcblxuICAgICAgYnIuX2NoYW5nZVN0YXRlKDEyMzQ1KVxuXG4gICAgICBleHBlY3QoYnIuX3NlbGVjdGVkTWFpbGJveCkudG8uYmUuZmFsc2VcbiAgICAgIGV4cGVjdChici5vbmNsb3NlbWFpbGJveC53aXRoQXJncygnYWFhJykuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNfZW5zdXJlUGF0aCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSB0aGUgcGF0aCBpZiBub3QgcHJlc2VudCcsICgpID0+IHtcbiAgICAgIHZhciB0cmVlID0ge1xuICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgIH1cbiAgICAgIGV4cGVjdChici5fZW5zdXJlUGF0aCh0cmVlLCAnaGVsbG8vd29ybGQnLCAnLycpKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgbmFtZTogJ3dvcmxkJyxcbiAgICAgICAgZGVsaW1pdGVyOiAnLycsXG4gICAgICAgIHBhdGg6ICdoZWxsby93b3JsZCcsXG4gICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgfSlcbiAgICAgIGV4cGVjdCh0cmVlKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgbmFtZTogJ2hlbGxvJyxcbiAgICAgICAgICBkZWxpbWl0ZXI6ICcvJyxcbiAgICAgICAgICBwYXRoOiAnaGVsbG8nLFxuICAgICAgICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgbmFtZTogJ3dvcmxkJyxcbiAgICAgICAgICAgIGRlbGltaXRlcjogJy8nLFxuICAgICAgICAgICAgcGF0aDogJ2hlbGxvL3dvcmxkJyxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgICAgIH1dXG4gICAgICAgIH1dXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBleGlzdGluZyBwYXRoIGlmIHBvc3NpYmxlJywgKCkgPT4ge1xuICAgICAgdmFyIHRyZWUgPSB7XG4gICAgICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgIG5hbWU6ICdoZWxsbycsXG4gICAgICAgICAgZGVsaW1pdGVyOiAnLycsXG4gICAgICAgICAgcGF0aDogJ2hlbGxvJyxcbiAgICAgICAgICBjaGlsZHJlbjogW3tcbiAgICAgICAgICAgIG5hbWU6ICd3b3JsZCcsXG4gICAgICAgICAgICBkZWxpbWl0ZXI6ICcvJyxcbiAgICAgICAgICAgIHBhdGg6ICdoZWxsby93b3JsZCcsXG4gICAgICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICAgICAgICBhYmM6IDEyM1xuICAgICAgICAgIH1dXG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgICBleHBlY3QoYnIuX2Vuc3VyZVBhdGgodHJlZSwgJ2hlbGxvL3dvcmxkJywgJy8nKSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgIG5hbWU6ICd3b3JsZCcsXG4gICAgICAgIGRlbGltaXRlcjogJy8nLFxuICAgICAgICBwYXRoOiAnaGVsbG8vd29ybGQnLFxuICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICAgIGFiYzogMTIzXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBjYXNlIGluc2Vuc2l0aXZlIEluYm94JywgKCkgPT4ge1xuICAgICAgdmFyIHRyZWUgPSB7XG4gICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgfVxuICAgICAgZXhwZWN0KGJyLl9lbnN1cmVQYXRoKHRyZWUsICdJbmJveC93b3JsZCcsICcvJykpLnRvLmRlZXAuZXF1YWwoe1xuICAgICAgICBuYW1lOiAnd29ybGQnLFxuICAgICAgICBkZWxpbWl0ZXI6ICcvJyxcbiAgICAgICAgcGF0aDogJ0luYm94L3dvcmxkJyxcbiAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICB9KVxuICAgICAgZXhwZWN0KGJyLl9lbnN1cmVQYXRoKHRyZWUsICdJTkJPWC93b3JsZHMnLCAnLycpKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgbmFtZTogJ3dvcmxkcycsXG4gICAgICAgIGRlbGltaXRlcjogJy8nLFxuICAgICAgICBwYXRoOiAnSU5CT1gvd29ybGRzJyxcbiAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICB9KVxuXG4gICAgICBleHBlY3QodHJlZSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgIG5hbWU6ICdJbmJveCcsXG4gICAgICAgICAgZGVsaW1pdGVyOiAnLycsXG4gICAgICAgICAgcGF0aDogJ0luYm94JyxcbiAgICAgICAgICBjaGlsZHJlbjogW3tcbiAgICAgICAgICAgIG5hbWU6ICd3b3JsZCcsXG4gICAgICAgICAgICBkZWxpbWl0ZXI6ICcvJyxcbiAgICAgICAgICAgIHBhdGg6ICdJbmJveC93b3JsZCcsXG4gICAgICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBuYW1lOiAnd29ybGRzJyxcbiAgICAgICAgICAgIGRlbGltaXRlcjogJy8nLFxuICAgICAgICAgICAgcGF0aDogJ0lOQk9YL3dvcmxkcycsXG4gICAgICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgICAgICB9XVxuICAgICAgICB9XVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCd1bnRhZ2dlZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmVjZWl2ZSBpbmZvcm1hdGlvbiBhYm91dCB1bnRhZ2dlZCBleGlzdHMnLCAoZG9uZSkgPT4ge1xuICAgICAgYnIuY2xpZW50Ll9jb25uZWN0aW9uUmVhZHkgPSB0cnVlXG4gICAgICBici5fc2VsZWN0ZWRNYWlsYm94ID0gJ0ZPTydcbiAgICAgIGJyLm9udXBkYXRlID0gKHBhdGgsIHR5cGUsIHZhbHVlKSA9PiB7XG4gICAgICAgIGV4cGVjdChwYXRoKS50by5lcXVhbCgnRk9PJylcbiAgICAgICAgZXhwZWN0KHR5cGUpLnRvLmVxdWFsKCdleGlzdHMnKVxuICAgICAgICBleHBlY3QodmFsdWUpLnRvLmVxdWFsKDEyMylcbiAgICAgICAgZG9uZSgpXG4gICAgICB9XG4gICAgICBici5jbGllbnQuX29uRGF0YSh7XG4gICAgICAgIC8qICogMTIzIEVYSVNUU1xcclxcbiAqL1xuICAgICAgICBkYXRhOiBuZXcgVWludDhBcnJheShbNDIsIDMyLCA0OSwgNTAsIDUxLCAzMiwgNjksIDg4LCA3MywgODMsIDg0LCA4MywgMTMsIDEwXSkuYnVmZmVyXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJlY2VpdmUgaW5mb3JtYXRpb24gYWJvdXQgdW50YWdnZWQgZXhwdW5nZScsIChkb25lKSA9PiB7XG4gICAgICBici5jbGllbnQuX2Nvbm5lY3Rpb25SZWFkeSA9IHRydWVcbiAgICAgIGJyLl9zZWxlY3RlZE1haWxib3ggPSAnRk9PJ1xuICAgICAgYnIub251cGRhdGUgPSAocGF0aCwgdHlwZSwgdmFsdWUpID0+IHtcbiAgICAgICAgZXhwZWN0KHBhdGgpLnRvLmVxdWFsKCdGT08nKVxuICAgICAgICBleHBlY3QodHlwZSkudG8uZXF1YWwoJ2V4cHVuZ2UnKVxuICAgICAgICBleHBlY3QodmFsdWUpLnRvLmVxdWFsKDQ1NilcbiAgICAgICAgZG9uZSgpXG4gICAgICB9XG4gICAgICBici5jbGllbnQuX29uRGF0YSh7XG4gICAgICAgIC8qICogNDU2IEVYUFVOR0VcXHJcXG4gKi9cbiAgICAgICAgZGF0YTogbmV3IFVpbnQ4QXJyYXkoWzQyLCAzMiwgNTIsIDUzLCA1NCwgMzIsIDY5LCA4OCwgODAsIDg1LCA3OCwgNzEsIDY5LCAxMywgMTBdKS5idWZmZXJcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVjZWl2ZSBpbmZvcm1hdGlvbiBhYm91dCB1bnRhZ2dlZCBmZXRjaCcsIChkb25lKSA9PiB7XG4gICAgICBici5jbGllbnQuX2Nvbm5lY3Rpb25SZWFkeSA9IHRydWVcbiAgICAgIGJyLl9zZWxlY3RlZE1haWxib3ggPSAnRk9PJ1xuICAgICAgYnIub251cGRhdGUgPSAocGF0aCwgdHlwZSwgdmFsdWUpID0+IHtcbiAgICAgICAgZXhwZWN0KHBhdGgpLnRvLmVxdWFsKCdGT08nKVxuICAgICAgICBleHBlY3QodHlwZSkudG8uZXF1YWwoJ2ZldGNoJylcbiAgICAgICAgZXhwZWN0KHZhbHVlKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAnIyc6IDEyMyxcbiAgICAgICAgICBmbGFnczogWydcXFxcU2VlbiddLFxuICAgICAgICAgIG1vZHNlcTogJzQnXG4gICAgICAgIH0pXG4gICAgICAgIGRvbmUoKVxuICAgICAgfVxuICAgICAgYnIuY2xpZW50Ll9vbkRhdGEoe1xuICAgICAgICAvKiAqIDEyMyBGRVRDSCAoRkxBR1MgKFxcXFxTZWVuKSBNT0RTRVEgKDQpKVxcclxcbiAqL1xuICAgICAgICBkYXRhOiBuZXcgVWludDhBcnJheShbNDIsIDMyLCA0OSwgNTAsIDUxLCAzMiwgNzAsIDY5LCA4NCwgNjcsIDcyLCAzMiwgNDAsIDcwLCA3NiwgNjUsIDcxLCA4MywgMzIsIDQwLCA5MiwgODMsIDEwMSwgMTAxLCAxMTAsIDQxLCAzMiwgNzcsIDc5LCA2OCwgODMsIDY5LCA4MSwgMzIsIDQwLCA1MiwgNDEsIDQxLCAxMywgMTBdKS5idWZmZXJcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=