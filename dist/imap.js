function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

import { propOr } from 'ramda';
import TCPSocket from 'emailjs-tcp-socket';
import { toTypedArray, fromTypedArray } from './common';
import { parser, compiler } from 'emailjs-imap-handler';
import Compression from './compression';

/* babel-plugin-inline-import '../res/compression.worker.blob' */
var CompressionBlob = "!function(e){var t={};function a(n){if(t[n])return t[n].exports;var i=t[n]={i:n,l:!1,exports:{}};return e[n].call(i.exports,i,i.exports,a),i.l=!0,i.exports}a.m=e,a.c=t,a.d=function(e,t,n){a.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},a.r=function(e){\"undefined\"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:\"Module\"}),Object.defineProperty(e,\"__esModule\",{value:!0})},a.t=function(e,t){if(1&t&&(e=a(e)),8&t)return e;if(4&t&&\"object\"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(a.r(n),Object.defineProperty(n,\"default\",{enumerable:!0,value:e}),2&t&&\"string\"!=typeof e)for(var i in e)a.d(n,i,function(t){return e[t]}.bind(null,i));return n},a.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return a.d(t,\"a\",t),t},a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},a.p=\"\",a(a.s=11)}([function(e,t,a){\"use strict\";e.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},function(e,t,a){\"use strict\";e.exports={2:\"need dictionary\",1:\"stream end\",0:\"\",\"-1\":\"file error\",\"-2\":\"stream error\",\"-3\":\"data error\",\"-4\":\"insufficient memory\",\"-5\":\"buffer error\",\"-6\":\"incompatible version\"}},function(e,t,a){\"use strict\";var n=\"undefined\"!=typeof Uint8Array&&\"undefined\"!=typeof Uint16Array&&\"undefined\"!=typeof Int32Array;function i(e,t){return Object.prototype.hasOwnProperty.call(e,t)}t.assign=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var a=t.shift();if(a){if(\"object\"!=typeof a)throw new TypeError(a+\"must be non-object\");for(var n in a)i(a,n)&&(e[n]=a[n])}}return e},t.shrinkBuf=function(e,t){return e.length===t?e:e.subarray?e.subarray(0,t):(e.length=t,e)};var r={arraySet:function(e,t,a,n,i){if(t.subarray&&e.subarray)e.set(t.subarray(a,a+n),i);else for(var r=0;r<n;r++)e[i+r]=t[a+r]},flattenChunks:function(e){var t,a,n,i,r,s;for(n=0,t=0,a=e.length;t<a;t++)n+=e[t].length;for(s=new Uint8Array(n),i=0,t=0,a=e.length;t<a;t++)r=e[t],s.set(r,i),i+=r.length;return s}},s={arraySet:function(e,t,a,n,i){for(var r=0;r<n;r++)e[i+r]=t[a+r]},flattenChunks:function(e){return[].concat.apply([],e)}};t.setTyped=function(e){e?(t.Buf8=Uint8Array,t.Buf16=Uint16Array,t.Buf32=Int32Array,t.assign(t,r)):(t.Buf8=Array,t.Buf16=Array,t.Buf32=Array,t.assign(t,s))},t.setTyped(n)},function(e,t,a){\"use strict\";e.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg=\"\",this.state=null,this.data_type=2,this.adler=0}},function(e,t,a){\"use strict\";var n,i=a(2),r=a(8),s=a(6),l=a(7),o=a(1);function h(e,t){return e.msg=o[t],t}function d(e){return(e<<1)-(e>4?9:0)}function _(e){for(var t=e.length;--t>=0;)e[t]=0}function f(e){var t=e.state,a=t.pending;a>e.avail_out&&(a=e.avail_out),0!==a&&(i.arraySet(e.output,t.pending_buf,t.pending_out,a,e.next_out),e.next_out+=a,t.pending_out+=a,e.total_out+=a,e.avail_out-=a,t.pending-=a,0===t.pending&&(t.pending_out=0))}function u(e,t){r._tr_flush_block(e,e.block_start>=0?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,f(e.strm)}function c(e,t){e.pending_buf[e.pending++]=t}function b(e,t){e.pending_buf[e.pending++]=t>>>8&255,e.pending_buf[e.pending++]=255&t}function g(e,t){var a,n,i=e.max_chain_length,r=e.strstart,s=e.prev_length,l=e.nice_match,o=e.strstart>e.w_size-262?e.strstart-(e.w_size-262):0,h=e.window,d=e.w_mask,_=e.prev,f=e.strstart+258,u=h[r+s-1],c=h[r+s];e.prev_length>=e.good_match&&(i>>=2),l>e.lookahead&&(l=e.lookahead);do{if(h[(a=t)+s]===c&&h[a+s-1]===u&&h[a]===h[r]&&h[++a]===h[r+1]){r+=2,a++;do{}while(h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&r<f);if(n=258-(f-r),r=f-258,n>s){if(e.match_start=t,s=n,n>=l)break;u=h[r+s-1],c=h[r+s]}}}while((t=_[t&d])>o&&0!=--i);return s<=e.lookahead?s:e.lookahead}function m(e){var t,a,n,r,o,h,d,_,f,u,c=e.w_size;do{if(r=e.window_size-e.lookahead-e.strstart,e.strstart>=c+(c-262)){i.arraySet(e.window,e.window,c,c,0),e.match_start-=c,e.strstart-=c,e.block_start-=c,t=a=e.hash_size;do{n=e.head[--t],e.head[t]=n>=c?n-c:0}while(--a);t=a=c;do{n=e.prev[--t],e.prev[t]=n>=c?n-c:0}while(--a);r+=c}if(0===e.strm.avail_in)break;if(h=e.strm,d=e.window,_=e.strstart+e.lookahead,f=r,u=void 0,(u=h.avail_in)>f&&(u=f),a=0===u?0:(h.avail_in-=u,i.arraySet(d,h.input,h.next_in,u,_),1===h.state.wrap?h.adler=s(h.adler,d,u,_):2===h.state.wrap&&(h.adler=l(h.adler,d,u,_)),h.next_in+=u,h.total_in+=u,u),e.lookahead+=a,e.lookahead+e.insert>=3)for(o=e.strstart-e.insert,e.ins_h=e.window[o],e.ins_h=(e.ins_h<<e.hash_shift^e.window[o+1])&e.hash_mask;e.insert&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[o+3-1])&e.hash_mask,e.prev[o&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=o,o++,e.insert--,!(e.lookahead+e.insert<3)););}while(e.lookahead<262&&0!==e.strm.avail_in)}function w(e,t){for(var a,n;;){if(e.lookahead<262){if(m(e),e.lookahead<262&&0===t)return 1;if(0===e.lookahead)break}if(a=0,e.lookahead>=3&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+3-1])&e.hash_mask,a=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!==a&&e.strstart-a<=e.w_size-262&&(e.match_length=g(e,a)),e.match_length>=3)if(n=r._tr_tally(e,e.strstart-e.match_start,e.match_length-3),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=3){e.match_length--;do{e.strstart++,e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+3-1])&e.hash_mask,a=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart}while(0!=--e.match_length);e.strstart++}else e.strstart+=e.match_length,e.match_length=0,e.ins_h=e.window[e.strstart],e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+1])&e.hash_mask;else n=r._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(n&&(u(e,!1),0===e.strm.avail_out))return 1}return e.insert=e.strstart<2?e.strstart:2,4===t?(u(e,!0),0===e.strm.avail_out?3:4):e.last_lit&&(u(e,!1),0===e.strm.avail_out)?1:2}function p(e,t){for(var a,n,i;;){if(e.lookahead<262){if(m(e),e.lookahead<262&&0===t)return 1;if(0===e.lookahead)break}if(a=0,e.lookahead>=3&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+3-1])&e.hash_mask,a=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=2,0!==a&&e.prev_length<e.max_lazy_match&&e.strstart-a<=e.w_size-262&&(e.match_length=g(e,a),e.match_length<=5&&(1===e.strategy||3===e.match_length&&e.strstart-e.match_start>4096)&&(e.match_length=2)),e.prev_length>=3&&e.match_length<=e.prev_length){i=e.strstart+e.lookahead-3,n=r._tr_tally(e,e.strstart-1-e.prev_match,e.prev_length-3),e.lookahead-=e.prev_length-1,e.prev_length-=2;do{++e.strstart<=i&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+3-1])&e.hash_mask,a=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart)}while(0!=--e.prev_length);if(e.match_available=0,e.match_length=2,e.strstart++,n&&(u(e,!1),0===e.strm.avail_out))return 1}else if(e.match_available){if((n=r._tr_tally(e,0,e.window[e.strstart-1]))&&u(e,!1),e.strstart++,e.lookahead--,0===e.strm.avail_out)return 1}else e.match_available=1,e.strstart++,e.lookahead--}return e.match_available&&(n=r._tr_tally(e,0,e.window[e.strstart-1]),e.match_available=0),e.insert=e.strstart<2?e.strstart:2,4===t?(u(e,!0),0===e.strm.avail_out?3:4):e.last_lit&&(u(e,!1),0===e.strm.avail_out)?1:2}function v(e,t,a,n,i){this.good_length=e,this.max_lazy=t,this.nice_length=a,this.max_chain=n,this.func=i}function k(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=8,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new i.Buf16(1146),this.dyn_dtree=new i.Buf16(122),this.bl_tree=new i.Buf16(78),_(this.dyn_ltree),_(this.dyn_dtree),_(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new i.Buf16(16),this.heap=new i.Buf16(573),_(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new i.Buf16(573),_(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function y(e){var t;return e&&e.state?(e.total_in=e.total_out=0,e.data_type=2,(t=e.state).pending=0,t.pending_out=0,t.wrap<0&&(t.wrap=-t.wrap),t.status=t.wrap?42:113,e.adler=2===t.wrap?0:1,t.last_flush=0,r._tr_init(t),0):h(e,-2)}function x(e){var t,a=y(e);return 0===a&&((t=e.state).window_size=2*t.w_size,_(t.head),t.max_lazy_match=n[t.level].max_lazy,t.good_match=n[t.level].good_length,t.nice_match=n[t.level].nice_length,t.max_chain_length=n[t.level].max_chain,t.strstart=0,t.block_start=0,t.lookahead=0,t.insert=0,t.match_length=t.prev_length=2,t.match_available=0,t.ins_h=0),a}function z(e,t,a,n,r,s){if(!e)return-2;var l=1;if(-1===t&&(t=6),n<0?(l=0,n=-n):n>15&&(l=2,n-=16),r<1||r>9||8!==a||n<8||n>15||t<0||t>9||s<0||s>4)return h(e,-2);8===n&&(n=9);var o=new k;return e.state=o,o.strm=e,o.wrap=l,o.gzhead=null,o.w_bits=n,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=r+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+3-1)/3),o.window=new i.Buf8(2*o.w_size),o.head=new i.Buf16(o.hash_size),o.prev=new i.Buf16(o.w_size),o.lit_bufsize=1<<r+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new i.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=t,o.strategy=s,o.method=a,x(e)}n=[new v(0,0,0,0,(function(e,t){var a=65535;for(a>e.pending_buf_size-5&&(a=e.pending_buf_size-5);;){if(e.lookahead<=1){if(m(e),0===e.lookahead&&0===t)return 1;if(0===e.lookahead)break}e.strstart+=e.lookahead,e.lookahead=0;var n=e.block_start+a;if((0===e.strstart||e.strstart>=n)&&(e.lookahead=e.strstart-n,e.strstart=n,u(e,!1),0===e.strm.avail_out))return 1;if(e.strstart-e.block_start>=e.w_size-262&&(u(e,!1),0===e.strm.avail_out))return 1}return e.insert=0,4===t?(u(e,!0),0===e.strm.avail_out?3:4):(e.strstart>e.block_start&&(u(e,!1),e.strm.avail_out),1)})),new v(4,4,8,4,w),new v(4,5,16,8,w),new v(4,6,32,32,w),new v(4,4,16,16,p),new v(8,16,32,32,p),new v(8,16,128,128,p),new v(8,32,128,256,p),new v(32,128,258,1024,p),new v(32,258,258,4096,p)],t.deflateInit=function(e,t){return z(e,t,8,15,8,0)},t.deflateInit2=z,t.deflateReset=x,t.deflateResetKeep=y,t.deflateSetHeader=function(e,t){return e&&e.state?2!==e.state.wrap?-2:(e.state.gzhead=t,0):-2},t.deflate=function(e,t){var a,i,s,o;if(!e||!e.state||t>5||t<0)return e?h(e,-2):-2;if(i=e.state,!e.output||!e.input&&0!==e.avail_in||666===i.status&&4!==t)return h(e,0===e.avail_out?-5:-2);if(i.strm=e,a=i.last_flush,i.last_flush=t,42===i.status)if(2===i.wrap)e.adler=0,c(i,31),c(i,139),c(i,8),i.gzhead?(c(i,(i.gzhead.text?1:0)+(i.gzhead.hcrc?2:0)+(i.gzhead.extra?4:0)+(i.gzhead.name?8:0)+(i.gzhead.comment?16:0)),c(i,255&i.gzhead.time),c(i,i.gzhead.time>>8&255),c(i,i.gzhead.time>>16&255),c(i,i.gzhead.time>>24&255),c(i,9===i.level?2:i.strategy>=2||i.level<2?4:0),c(i,255&i.gzhead.os),i.gzhead.extra&&i.gzhead.extra.length&&(c(i,255&i.gzhead.extra.length),c(i,i.gzhead.extra.length>>8&255)),i.gzhead.hcrc&&(e.adler=l(e.adler,i.pending_buf,i.pending,0)),i.gzindex=0,i.status=69):(c(i,0),c(i,0),c(i,0),c(i,0),c(i,0),c(i,9===i.level?2:i.strategy>=2||i.level<2?4:0),c(i,3),i.status=113);else{var g=8+(i.w_bits-8<<4)<<8;g|=(i.strategy>=2||i.level<2?0:i.level<6?1:6===i.level?2:3)<<6,0!==i.strstart&&(g|=32),g+=31-g%31,i.status=113,b(i,g),0!==i.strstart&&(b(i,e.adler>>>16),b(i,65535&e.adler)),e.adler=1}if(69===i.status)if(i.gzhead.extra){for(s=i.pending;i.gzindex<(65535&i.gzhead.extra.length)&&(i.pending!==i.pending_buf_size||(i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),f(e),s=i.pending,i.pending!==i.pending_buf_size));)c(i,255&i.gzhead.extra[i.gzindex]),i.gzindex++;i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),i.gzindex===i.gzhead.extra.length&&(i.gzindex=0,i.status=73)}else i.status=73;if(73===i.status)if(i.gzhead.name){s=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),f(e),s=i.pending,i.pending===i.pending_buf_size)){o=1;break}o=i.gzindex<i.gzhead.name.length?255&i.gzhead.name.charCodeAt(i.gzindex++):0,c(i,o)}while(0!==o);i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),0===o&&(i.gzindex=0,i.status=91)}else i.status=91;if(91===i.status)if(i.gzhead.comment){s=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),f(e),s=i.pending,i.pending===i.pending_buf_size)){o=1;break}o=i.gzindex<i.gzhead.comment.length?255&i.gzhead.comment.charCodeAt(i.gzindex++):0,c(i,o)}while(0!==o);i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),0===o&&(i.status=103)}else i.status=103;if(103===i.status&&(i.gzhead.hcrc?(i.pending+2>i.pending_buf_size&&f(e),i.pending+2<=i.pending_buf_size&&(c(i,255&e.adler),c(i,e.adler>>8&255),e.adler=0,i.status=113)):i.status=113),0!==i.pending){if(f(e),0===e.avail_out)return i.last_flush=-1,0}else if(0===e.avail_in&&d(t)<=d(a)&&4!==t)return h(e,-5);if(666===i.status&&0!==e.avail_in)return h(e,-5);if(0!==e.avail_in||0!==i.lookahead||0!==t&&666!==i.status){var w=2===i.strategy?function(e,t){for(var a;;){if(0===e.lookahead&&(m(e),0===e.lookahead)){if(0===t)return 1;break}if(e.match_length=0,a=r._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++,a&&(u(e,!1),0===e.strm.avail_out))return 1}return e.insert=0,4===t?(u(e,!0),0===e.strm.avail_out?3:4):e.last_lit&&(u(e,!1),0===e.strm.avail_out)?1:2}(i,t):3===i.strategy?function(e,t){for(var a,n,i,s,l=e.window;;){if(e.lookahead<=258){if(m(e),e.lookahead<=258&&0===t)return 1;if(0===e.lookahead)break}if(e.match_length=0,e.lookahead>=3&&e.strstart>0&&(n=l[i=e.strstart-1])===l[++i]&&n===l[++i]&&n===l[++i]){s=e.strstart+258;do{}while(n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&i<s);e.match_length=258-(s-i),e.match_length>e.lookahead&&(e.match_length=e.lookahead)}if(e.match_length>=3?(a=r._tr_tally(e,1,e.match_length-3),e.lookahead-=e.match_length,e.strstart+=e.match_length,e.match_length=0):(a=r._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++),a&&(u(e,!1),0===e.strm.avail_out))return 1}return e.insert=0,4===t?(u(e,!0),0===e.strm.avail_out?3:4):e.last_lit&&(u(e,!1),0===e.strm.avail_out)?1:2}(i,t):n[i.level].func(i,t);if(3!==w&&4!==w||(i.status=666),1===w||3===w)return 0===e.avail_out&&(i.last_flush=-1),0;if(2===w&&(1===t?r._tr_align(i):5!==t&&(r._tr_stored_block(i,0,0,!1),3===t&&(_(i.head),0===i.lookahead&&(i.strstart=0,i.block_start=0,i.insert=0))),f(e),0===e.avail_out))return i.last_flush=-1,0}return 4!==t?0:i.wrap<=0?1:(2===i.wrap?(c(i,255&e.adler),c(i,e.adler>>8&255),c(i,e.adler>>16&255),c(i,e.adler>>24&255),c(i,255&e.total_in),c(i,e.total_in>>8&255),c(i,e.total_in>>16&255),c(i,e.total_in>>24&255)):(b(i,e.adler>>>16),b(i,65535&e.adler)),f(e),i.wrap>0&&(i.wrap=-i.wrap),0!==i.pending?0:1)},t.deflateEnd=function(e){var t;return e&&e.state?42!==(t=e.state.status)&&69!==t&&73!==t&&91!==t&&103!==t&&113!==t&&666!==t?h(e,-2):(e.state=null,113===t?h(e,-3):0):-2},t.deflateSetDictionary=function(e,t){var a,n,r,l,o,h,d,f,u=t.length;if(!e||!e.state)return-2;if(2===(l=(a=e.state).wrap)||1===l&&42!==a.status||a.lookahead)return-2;for(1===l&&(e.adler=s(e.adler,t,u,0)),a.wrap=0,u>=a.w_size&&(0===l&&(_(a.head),a.strstart=0,a.block_start=0,a.insert=0),f=new i.Buf8(a.w_size),i.arraySet(f,t,u-a.w_size,a.w_size,0),t=f,u=a.w_size),o=e.avail_in,h=e.next_in,d=e.input,e.avail_in=u,e.next_in=0,e.input=t,m(a);a.lookahead>=3;){n=a.strstart,r=a.lookahead-2;do{a.ins_h=(a.ins_h<<a.hash_shift^a.window[n+3-1])&a.hash_mask,a.prev[n&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=n,n++}while(--r);a.strstart=n,a.lookahead=2,m(a)}return a.strstart+=a.lookahead,a.block_start=a.strstart,a.insert=a.lookahead,a.lookahead=0,a.match_length=a.prev_length=2,a.match_available=0,e.next_in=h,e.input=d,e.avail_in=o,a.wrap=l,0},t.deflateInfo=\"pako deflate (from Nodeca project)\"},function(e,t,a){\"use strict\";var n=a(2),i=a(6),r=a(7),s=a(9),l=a(10);function o(e){return(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)}function h(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new n.Buf16(320),this.work=new n.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function d(e){var t;return e&&e.state?(t=e.state,e.total_in=e.total_out=t.total=0,e.msg=\"\",t.wrap&&(e.adler=1&t.wrap),t.mode=1,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new n.Buf32(852),t.distcode=t.distdyn=new n.Buf32(592),t.sane=1,t.back=-1,0):-2}function _(e){var t;return e&&e.state?((t=e.state).wsize=0,t.whave=0,t.wnext=0,d(e)):-2}function f(e,t){var a,n;return e&&e.state?(n=e.state,t<0?(a=0,t=-t):(a=1+(t>>4),t<48&&(t&=15)),t&&(t<8||t>15)?-2:(null!==n.window&&n.wbits!==t&&(n.window=null),n.wrap=a,n.wbits=t,_(e))):-2}function u(e,t){var a,n;return e?(n=new h,e.state=n,n.window=null,0!==(a=f(e,t))&&(e.state=null),a):-2}var c,b,g=!0;function m(e){if(g){var t;for(c=new n.Buf32(512),b=new n.Buf32(32),t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(l(1,e.lens,0,288,c,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;l(2,e.lens,0,32,b,0,e.work,{bits:5}),g=!1}e.lencode=c,e.lenbits=9,e.distcode=b,e.distbits=5}function w(e,t,a,i){var r,s=e.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new n.Buf8(s.wsize)),i>=s.wsize?(n.arraySet(s.window,t,a-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):((r=s.wsize-s.wnext)>i&&(r=i),n.arraySet(s.window,t,a-i,r,s.wnext),(i-=r)?(n.arraySet(s.window,t,a-i,i,0),s.wnext=i,s.whave=s.wsize):(s.wnext+=r,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=r))),0}t.inflateReset=_,t.inflateReset2=f,t.inflateResetKeep=d,t.inflateInit=function(e){return u(e,15)},t.inflateInit2=u,t.inflate=function(e,t){var a,h,d,_,f,u,c,b,g,p,v,k,y,x,z,S,E,A,Z,O,R,B,T,N,D=0,U=new n.Buf8(4),I=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return-2;12===(a=e.state).mode&&(a.mode=13),f=e.next_out,d=e.output,c=e.avail_out,_=e.next_in,h=e.input,u=e.avail_in,b=a.hold,g=a.bits,p=u,v=c,B=0;e:for(;;)switch(a.mode){case 1:if(0===a.wrap){a.mode=13;break}for(;g<16;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(2&a.wrap&&35615===b){a.check=0,U[0]=255&b,U[1]=b>>>8&255,a.check=r(a.check,U,2,0),b=0,g=0,a.mode=2;break}if(a.flags=0,a.head&&(a.head.done=!1),!(1&a.wrap)||(((255&b)<<8)+(b>>8))%31){e.msg=\"incorrect header check\",a.mode=30;break}if(8!=(15&b)){e.msg=\"unknown compression method\",a.mode=30;break}if(g-=4,R=8+(15&(b>>>=4)),0===a.wbits)a.wbits=R;else if(R>a.wbits){e.msg=\"invalid window size\",a.mode=30;break}a.dmax=1<<R,e.adler=a.check=1,a.mode=512&b?10:12,b=0,g=0;break;case 2:for(;g<16;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(a.flags=b,8!=(255&a.flags)){e.msg=\"unknown compression method\",a.mode=30;break}if(57344&a.flags){e.msg=\"unknown header flags set\",a.mode=30;break}a.head&&(a.head.text=b>>8&1),512&a.flags&&(U[0]=255&b,U[1]=b>>>8&255,a.check=r(a.check,U,2,0)),b=0,g=0,a.mode=3;case 3:for(;g<32;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}a.head&&(a.head.time=b),512&a.flags&&(U[0]=255&b,U[1]=b>>>8&255,U[2]=b>>>16&255,U[3]=b>>>24&255,a.check=r(a.check,U,4,0)),b=0,g=0,a.mode=4;case 4:for(;g<16;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}a.head&&(a.head.xflags=255&b,a.head.os=b>>8),512&a.flags&&(U[0]=255&b,U[1]=b>>>8&255,a.check=r(a.check,U,2,0)),b=0,g=0,a.mode=5;case 5:if(1024&a.flags){for(;g<16;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}a.length=b,a.head&&(a.head.extra_len=b),512&a.flags&&(U[0]=255&b,U[1]=b>>>8&255,a.check=r(a.check,U,2,0)),b=0,g=0}else a.head&&(a.head.extra=null);a.mode=6;case 6:if(1024&a.flags&&((k=a.length)>u&&(k=u),k&&(a.head&&(R=a.head.extra_len-a.length,a.head.extra||(a.head.extra=new Array(a.head.extra_len)),n.arraySet(a.head.extra,h,_,k,R)),512&a.flags&&(a.check=r(a.check,h,k,_)),u-=k,_+=k,a.length-=k),a.length))break e;a.length=0,a.mode=7;case 7:if(2048&a.flags){if(0===u)break e;k=0;do{R=h[_+k++],a.head&&R&&a.length<65536&&(a.head.name+=String.fromCharCode(R))}while(R&&k<u);if(512&a.flags&&(a.check=r(a.check,h,k,_)),u-=k,_+=k,R)break e}else a.head&&(a.head.name=null);a.length=0,a.mode=8;case 8:if(4096&a.flags){if(0===u)break e;k=0;do{R=h[_+k++],a.head&&R&&a.length<65536&&(a.head.comment+=String.fromCharCode(R))}while(R&&k<u);if(512&a.flags&&(a.check=r(a.check,h,k,_)),u-=k,_+=k,R)break e}else a.head&&(a.head.comment=null);a.mode=9;case 9:if(512&a.flags){for(;g<16;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(b!==(65535&a.check)){e.msg=\"header crc mismatch\",a.mode=30;break}b=0,g=0}a.head&&(a.head.hcrc=a.flags>>9&1,a.head.done=!0),e.adler=a.check=0,a.mode=12;break;case 10:for(;g<32;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}e.adler=a.check=o(b),b=0,g=0,a.mode=11;case 11:if(0===a.havedict)return e.next_out=f,e.avail_out=c,e.next_in=_,e.avail_in=u,a.hold=b,a.bits=g,2;e.adler=a.check=1,a.mode=12;case 12:if(5===t||6===t)break e;case 13:if(a.last){b>>>=7&g,g-=7&g,a.mode=27;break}for(;g<3;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}switch(a.last=1&b,g-=1,3&(b>>>=1)){case 0:a.mode=14;break;case 1:if(m(a),a.mode=20,6===t){b>>>=2,g-=2;break e}break;case 2:a.mode=17;break;case 3:e.msg=\"invalid block type\",a.mode=30}b>>>=2,g-=2;break;case 14:for(b>>>=7&g,g-=7&g;g<32;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if((65535&b)!=(b>>>16^65535)){e.msg=\"invalid stored block lengths\",a.mode=30;break}if(a.length=65535&b,b=0,g=0,a.mode=15,6===t)break e;case 15:a.mode=16;case 16:if(k=a.length){if(k>u&&(k=u),k>c&&(k=c),0===k)break e;n.arraySet(d,h,_,k,f),u-=k,_+=k,c-=k,f+=k,a.length-=k;break}a.mode=12;break;case 17:for(;g<14;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(a.nlen=257+(31&b),b>>>=5,g-=5,a.ndist=1+(31&b),b>>>=5,g-=5,a.ncode=4+(15&b),b>>>=4,g-=4,a.nlen>286||a.ndist>30){e.msg=\"too many length or distance symbols\",a.mode=30;break}a.have=0,a.mode=18;case 18:for(;a.have<a.ncode;){for(;g<3;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}a.lens[I[a.have++]]=7&b,b>>>=3,g-=3}for(;a.have<19;)a.lens[I[a.have++]]=0;if(a.lencode=a.lendyn,a.lenbits=7,T={bits:a.lenbits},B=l(0,a.lens,0,19,a.lencode,0,a.work,T),a.lenbits=T.bits,B){e.msg=\"invalid code lengths set\",a.mode=30;break}a.have=0,a.mode=19;case 19:for(;a.have<a.nlen+a.ndist;){for(;S=(D=a.lencode[b&(1<<a.lenbits)-1])>>>16&255,E=65535&D,!((z=D>>>24)<=g);){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(E<16)b>>>=z,g-=z,a.lens[a.have++]=E;else{if(16===E){for(N=z+2;g<N;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(b>>>=z,g-=z,0===a.have){e.msg=\"invalid bit length repeat\",a.mode=30;break}R=a.lens[a.have-1],k=3+(3&b),b>>>=2,g-=2}else if(17===E){for(N=z+3;g<N;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}g-=z,R=0,k=3+(7&(b>>>=z)),b>>>=3,g-=3}else{for(N=z+7;g<N;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}g-=z,R=0,k=11+(127&(b>>>=z)),b>>>=7,g-=7}if(a.have+k>a.nlen+a.ndist){e.msg=\"invalid bit length repeat\",a.mode=30;break}for(;k--;)a.lens[a.have++]=R}}if(30===a.mode)break;if(0===a.lens[256]){e.msg=\"invalid code -- missing end-of-block\",a.mode=30;break}if(a.lenbits=9,T={bits:a.lenbits},B=l(1,a.lens,0,a.nlen,a.lencode,0,a.work,T),a.lenbits=T.bits,B){e.msg=\"invalid literal/lengths set\",a.mode=30;break}if(a.distbits=6,a.distcode=a.distdyn,T={bits:a.distbits},B=l(2,a.lens,a.nlen,a.ndist,a.distcode,0,a.work,T),a.distbits=T.bits,B){e.msg=\"invalid distances set\",a.mode=30;break}if(a.mode=20,6===t)break e;case 20:a.mode=21;case 21:if(u>=6&&c>=258){e.next_out=f,e.avail_out=c,e.next_in=_,e.avail_in=u,a.hold=b,a.bits=g,s(e,v),f=e.next_out,d=e.output,c=e.avail_out,_=e.next_in,h=e.input,u=e.avail_in,b=a.hold,g=a.bits,12===a.mode&&(a.back=-1);break}for(a.back=0;S=(D=a.lencode[b&(1<<a.lenbits)-1])>>>16&255,E=65535&D,!((z=D>>>24)<=g);){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(S&&0==(240&S)){for(A=z,Z=S,O=E;S=(D=a.lencode[O+((b&(1<<A+Z)-1)>>A)])>>>16&255,E=65535&D,!(A+(z=D>>>24)<=g);){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}b>>>=A,g-=A,a.back+=A}if(b>>>=z,g-=z,a.back+=z,a.length=E,0===S){a.mode=26;break}if(32&S){a.back=-1,a.mode=12;break}if(64&S){e.msg=\"invalid literal/length code\",a.mode=30;break}a.extra=15&S,a.mode=22;case 22:if(a.extra){for(N=a.extra;g<N;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}a.length+=b&(1<<a.extra)-1,b>>>=a.extra,g-=a.extra,a.back+=a.extra}a.was=a.length,a.mode=23;case 23:for(;S=(D=a.distcode[b&(1<<a.distbits)-1])>>>16&255,E=65535&D,!((z=D>>>24)<=g);){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(0==(240&S)){for(A=z,Z=S,O=E;S=(D=a.distcode[O+((b&(1<<A+Z)-1)>>A)])>>>16&255,E=65535&D,!(A+(z=D>>>24)<=g);){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}b>>>=A,g-=A,a.back+=A}if(b>>>=z,g-=z,a.back+=z,64&S){e.msg=\"invalid distance code\",a.mode=30;break}a.offset=E,a.extra=15&S,a.mode=24;case 24:if(a.extra){for(N=a.extra;g<N;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}a.offset+=b&(1<<a.extra)-1,b>>>=a.extra,g-=a.extra,a.back+=a.extra}if(a.offset>a.dmax){e.msg=\"invalid distance too far back\",a.mode=30;break}a.mode=25;case 25:if(0===c)break e;if(k=v-c,a.offset>k){if((k=a.offset-k)>a.whave&&a.sane){e.msg=\"invalid distance too far back\",a.mode=30;break}k>a.wnext?(k-=a.wnext,y=a.wsize-k):y=a.wnext-k,k>a.length&&(k=a.length),x=a.window}else x=d,y=f-a.offset,k=a.length;k>c&&(k=c),c-=k,a.length-=k;do{d[f++]=x[y++]}while(--k);0===a.length&&(a.mode=21);break;case 26:if(0===c)break e;d[f++]=a.length,c--,a.mode=21;break;case 27:if(a.wrap){for(;g<32;){if(0===u)break e;u--,b|=h[_++]<<g,g+=8}if(v-=c,e.total_out+=v,a.total+=v,v&&(e.adler=a.check=a.flags?r(a.check,d,v,f-v):i(a.check,d,v,f-v)),v=c,(a.flags?b:o(b))!==a.check){e.msg=\"incorrect data check\",a.mode=30;break}b=0,g=0}a.mode=28;case 28:if(a.wrap&&a.flags){for(;g<32;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(b!==(4294967295&a.total)){e.msg=\"incorrect length check\",a.mode=30;break}b=0,g=0}a.mode=29;case 29:B=1;break e;case 30:B=-3;break e;case 31:return-4;case 32:default:return-2}return e.next_out=f,e.avail_out=c,e.next_in=_,e.avail_in=u,a.hold=b,a.bits=g,(a.wsize||v!==e.avail_out&&a.mode<30&&(a.mode<27||4!==t))&&w(e,e.output,e.next_out,v-e.avail_out)?(a.mode=31,-4):(p-=e.avail_in,v-=e.avail_out,e.total_in+=p,e.total_out+=v,a.total+=v,a.wrap&&v&&(e.adler=a.check=a.flags?r(a.check,d,v,e.next_out-v):i(a.check,d,v,e.next_out-v)),e.data_type=a.bits+(a.last?64:0)+(12===a.mode?128:0)+(20===a.mode||15===a.mode?256:0),(0===p&&0===v||4===t)&&0===B&&(B=-5),B)},t.inflateEnd=function(e){if(!e||!e.state)return-2;var t=e.state;return t.window&&(t.window=null),e.state=null,0},t.inflateGetHeader=function(e,t){var a;return e&&e.state?0==(2&(a=e.state).wrap)?-2:(a.head=t,t.done=!1,0):-2},t.inflateSetDictionary=function(e,t){var a,n=t.length;return e&&e.state?0!==(a=e.state).wrap&&11!==a.mode?-2:11===a.mode&&i(1,t,n,0)!==a.check?-3:w(e,t,n,n)?(a.mode=31,-4):(a.havedict=1,0):-2},t.inflateInfo=\"pako inflate (from Nodeca project)\"},function(e,t,a){\"use strict\";e.exports=function(e,t,a,n){for(var i=65535&e|0,r=e>>>16&65535|0,s=0;0!==a;){a-=s=a>2e3?2e3:a;do{r=r+(i=i+t[n++]|0)|0}while(--s);i%=65521,r%=65521}return i|r<<16|0}},function(e,t,a){\"use strict\";var n=function(){for(var e,t=[],a=0;a<256;a++){e=a;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[a]=e}return t}();e.exports=function(e,t,a,i){var r=n,s=i+a;e^=-1;for(var l=i;l<s;l++)e=e>>>8^r[255&(e^t[l])];return-1^e}},function(e,t,a){\"use strict\";var n=a(2);function i(e){for(var t=e.length;--t>=0;)e[t]=0}var r=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],s=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],l=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],o=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],h=new Array(576);i(h);var d=new Array(60);i(d);var _=new Array(512);i(_);var f=new Array(256);i(f);var u=new Array(29);i(u);var c,b,g,m=new Array(30);function w(e,t,a,n,i){this.static_tree=e,this.extra_bits=t,this.extra_base=a,this.elems=n,this.max_length=i,this.has_stree=e&&e.length}function p(e,t){this.dyn_tree=e,this.max_code=0,this.stat_desc=t}function v(e){return e<256?_[e]:_[256+(e>>>7)]}function k(e,t){e.pending_buf[e.pending++]=255&t,e.pending_buf[e.pending++]=t>>>8&255}function y(e,t,a){e.bi_valid>16-a?(e.bi_buf|=t<<e.bi_valid&65535,k(e,e.bi_buf),e.bi_buf=t>>16-e.bi_valid,e.bi_valid+=a-16):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=a)}function x(e,t,a){y(e,a[2*t],a[2*t+1])}function z(e,t){var a=0;do{a|=1&e,e>>>=1,a<<=1}while(--t>0);return a>>>1}function S(e,t,a){var n,i,r=new Array(16),s=0;for(n=1;n<=15;n++)r[n]=s=s+a[n-1]<<1;for(i=0;i<=t;i++){var l=e[2*i+1];0!==l&&(e[2*i]=z(r[l]++,l))}}function E(e){var t;for(t=0;t<286;t++)e.dyn_ltree[2*t]=0;for(t=0;t<30;t++)e.dyn_dtree[2*t]=0;for(t=0;t<19;t++)e.bl_tree[2*t]=0;e.dyn_ltree[512]=1,e.opt_len=e.static_len=0,e.last_lit=e.matches=0}function A(e){e.bi_valid>8?k(e,e.bi_buf):e.bi_valid>0&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0}function Z(e,t,a,n){var i=2*t,r=2*a;return e[i]<e[r]||e[i]===e[r]&&n[t]<=n[a]}function O(e,t,a){for(var n=e.heap[a],i=a<<1;i<=e.heap_len&&(i<e.heap_len&&Z(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!Z(t,n,e.heap[i],e.depth));)e.heap[a]=e.heap[i],a=i,i<<=1;e.heap[a]=n}function R(e,t,a){var n,i,l,o,h=0;if(0!==e.last_lit)do{n=e.pending_buf[e.d_buf+2*h]<<8|e.pending_buf[e.d_buf+2*h+1],i=e.pending_buf[e.l_buf+h],h++,0===n?x(e,i,t):(x(e,(l=f[i])+256+1,t),0!==(o=r[l])&&y(e,i-=u[l],o),x(e,l=v(--n),a),0!==(o=s[l])&&y(e,n-=m[l],o))}while(h<e.last_lit);x(e,256,t)}function B(e,t){var a,n,i,r=t.dyn_tree,s=t.stat_desc.static_tree,l=t.stat_desc.has_stree,o=t.stat_desc.elems,h=-1;for(e.heap_len=0,e.heap_max=573,a=0;a<o;a++)0!==r[2*a]?(e.heap[++e.heap_len]=h=a,e.depth[a]=0):r[2*a+1]=0;for(;e.heap_len<2;)r[2*(i=e.heap[++e.heap_len]=h<2?++h:0)]=1,e.depth[i]=0,e.opt_len--,l&&(e.static_len-=s[2*i+1]);for(t.max_code=h,a=e.heap_len>>1;a>=1;a--)O(e,r,a);i=o;do{a=e.heap[1],e.heap[1]=e.heap[e.heap_len--],O(e,r,1),n=e.heap[1],e.heap[--e.heap_max]=a,e.heap[--e.heap_max]=n,r[2*i]=r[2*a]+r[2*n],e.depth[i]=(e.depth[a]>=e.depth[n]?e.depth[a]:e.depth[n])+1,r[2*a+1]=r[2*n+1]=i,e.heap[1]=i++,O(e,r,1)}while(e.heap_len>=2);e.heap[--e.heap_max]=e.heap[1],function(e,t){var a,n,i,r,s,l,o=t.dyn_tree,h=t.max_code,d=t.stat_desc.static_tree,_=t.stat_desc.has_stree,f=t.stat_desc.extra_bits,u=t.stat_desc.extra_base,c=t.stat_desc.max_length,b=0;for(r=0;r<=15;r++)e.bl_count[r]=0;for(o[2*e.heap[e.heap_max]+1]=0,a=e.heap_max+1;a<573;a++)(r=o[2*o[2*(n=e.heap[a])+1]+1]+1)>c&&(r=c,b++),o[2*n+1]=r,n>h||(e.bl_count[r]++,s=0,n>=u&&(s=f[n-u]),l=o[2*n],e.opt_len+=l*(r+s),_&&(e.static_len+=l*(d[2*n+1]+s)));if(0!==b){do{for(r=c-1;0===e.bl_count[r];)r--;e.bl_count[r]--,e.bl_count[r+1]+=2,e.bl_count[c]--,b-=2}while(b>0);for(r=c;0!==r;r--)for(n=e.bl_count[r];0!==n;)(i=e.heap[--a])>h||(o[2*i+1]!==r&&(e.opt_len+=(r-o[2*i+1])*o[2*i],o[2*i+1]=r),n--)}}(e,t),S(r,h,e.bl_count)}function T(e,t,a){var n,i,r=-1,s=t[1],l=0,o=7,h=4;for(0===s&&(o=138,h=3),t[2*(a+1)+1]=65535,n=0;n<=a;n++)i=s,s=t[2*(n+1)+1],++l<o&&i===s||(l<h?e.bl_tree[2*i]+=l:0!==i?(i!==r&&e.bl_tree[2*i]++,e.bl_tree[32]++):l<=10?e.bl_tree[34]++:e.bl_tree[36]++,l=0,r=i,0===s?(o=138,h=3):i===s?(o=6,h=3):(o=7,h=4))}function N(e,t,a){var n,i,r=-1,s=t[1],l=0,o=7,h=4;for(0===s&&(o=138,h=3),n=0;n<=a;n++)if(i=s,s=t[2*(n+1)+1],!(++l<o&&i===s)){if(l<h)do{x(e,i,e.bl_tree)}while(0!=--l);else 0!==i?(i!==r&&(x(e,i,e.bl_tree),l--),x(e,16,e.bl_tree),y(e,l-3,2)):l<=10?(x(e,17,e.bl_tree),y(e,l-3,3)):(x(e,18,e.bl_tree),y(e,l-11,7));l=0,r=i,0===s?(o=138,h=3):i===s?(o=6,h=3):(o=7,h=4)}}i(m);var D=!1;function U(e,t,a,i){y(e,0+(i?1:0),3),function(e,t,a,i){A(e),i&&(k(e,a),k(e,~a)),n.arraySet(e.pending_buf,e.window,t,a,e.pending),e.pending+=a}(e,t,a,!0)}t._tr_init=function(e){D||(!function(){var e,t,a,n,i,o=new Array(16);for(a=0,n=0;n<28;n++)for(u[n]=a,e=0;e<1<<r[n];e++)f[a++]=n;for(f[a-1]=n,i=0,n=0;n<16;n++)for(m[n]=i,e=0;e<1<<s[n];e++)_[i++]=n;for(i>>=7;n<30;n++)for(m[n]=i<<7,e=0;e<1<<s[n]-7;e++)_[256+i++]=n;for(t=0;t<=15;t++)o[t]=0;for(e=0;e<=143;)h[2*e+1]=8,e++,o[8]++;for(;e<=255;)h[2*e+1]=9,e++,o[9]++;for(;e<=279;)h[2*e+1]=7,e++,o[7]++;for(;e<=287;)h[2*e+1]=8,e++,o[8]++;for(S(h,287,o),e=0;e<30;e++)d[2*e+1]=5,d[2*e]=z(e,5);c=new w(h,r,257,286,15),b=new w(d,s,0,30,15),g=new w(new Array(0),l,0,19,7)}(),D=!0),e.l_desc=new p(e.dyn_ltree,c),e.d_desc=new p(e.dyn_dtree,b),e.bl_desc=new p(e.bl_tree,g),e.bi_buf=0,e.bi_valid=0,E(e)},t._tr_stored_block=U,t._tr_flush_block=function(e,t,a,n){var i,r,s=0;e.level>0?(2===e.strm.data_type&&(e.strm.data_type=function(e){var t,a=4093624447;for(t=0;t<=31;t++,a>>>=1)if(1&a&&0!==e.dyn_ltree[2*t])return 0;if(0!==e.dyn_ltree[18]||0!==e.dyn_ltree[20]||0!==e.dyn_ltree[26])return 1;for(t=32;t<256;t++)if(0!==e.dyn_ltree[2*t])return 1;return 0}(e)),B(e,e.l_desc),B(e,e.d_desc),s=function(e){var t;for(T(e,e.dyn_ltree,e.l_desc.max_code),T(e,e.dyn_dtree,e.d_desc.max_code),B(e,e.bl_desc),t=18;t>=3&&0===e.bl_tree[2*o[t]+1];t--);return e.opt_len+=3*(t+1)+5+5+4,t}(e),i=e.opt_len+3+7>>>3,(r=e.static_len+3+7>>>3)<=i&&(i=r)):i=r=a+5,a+4<=i&&-1!==t?U(e,t,a,n):4===e.strategy||r===i?(y(e,2+(n?1:0),3),R(e,h,d)):(y(e,4+(n?1:0),3),function(e,t,a,n){var i;for(y(e,t-257,5),y(e,a-1,5),y(e,n-4,4),i=0;i<n;i++)y(e,e.bl_tree[2*o[i]+1],3);N(e,e.dyn_ltree,t-1),N(e,e.dyn_dtree,a-1)}(e,e.l_desc.max_code+1,e.d_desc.max_code+1,s+1),R(e,e.dyn_ltree,e.dyn_dtree)),E(e),n&&A(e)},t._tr_tally=function(e,t,a){return e.pending_buf[e.d_buf+2*e.last_lit]=t>>>8&255,e.pending_buf[e.d_buf+2*e.last_lit+1]=255&t,e.pending_buf[e.l_buf+e.last_lit]=255&a,e.last_lit++,0===t?e.dyn_ltree[2*a]++:(e.matches++,t--,e.dyn_ltree[2*(f[a]+256+1)]++,e.dyn_dtree[2*v(t)]++),e.last_lit===e.lit_bufsize-1},t._tr_align=function(e){y(e,2,3),x(e,256,h),function(e){16===e.bi_valid?(k(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):e.bi_valid>=8&&(e.pending_buf[e.pending++]=255&e.bi_buf,e.bi_buf>>=8,e.bi_valid-=8)}(e)}},function(e,t,a){\"use strict\";e.exports=function(e,t){var a,n,i,r,s,l,o,h,d,_,f,u,c,b,g,m,w,p,v,k,y,x,z,S,E;a=e.state,n=e.next_in,S=e.input,i=n+(e.avail_in-5),r=e.next_out,E=e.output,s=r-(t-e.avail_out),l=r+(e.avail_out-257),o=a.dmax,h=a.wsize,d=a.whave,_=a.wnext,f=a.window,u=a.hold,c=a.bits,b=a.lencode,g=a.distcode,m=(1<<a.lenbits)-1,w=(1<<a.distbits)-1;e:do{c<15&&(u+=S[n++]<<c,c+=8,u+=S[n++]<<c,c+=8),p=b[u&m];t:for(;;){if(u>>>=v=p>>>24,c-=v,0===(v=p>>>16&255))E[r++]=65535&p;else{if(!(16&v)){if(0==(64&v)){p=b[(65535&p)+(u&(1<<v)-1)];continue t}if(32&v){a.mode=12;break e}e.msg=\"invalid literal/length code\",a.mode=30;break e}k=65535&p,(v&=15)&&(c<v&&(u+=S[n++]<<c,c+=8),k+=u&(1<<v)-1,u>>>=v,c-=v),c<15&&(u+=S[n++]<<c,c+=8,u+=S[n++]<<c,c+=8),p=g[u&w];a:for(;;){if(u>>>=v=p>>>24,c-=v,!(16&(v=p>>>16&255))){if(0==(64&v)){p=g[(65535&p)+(u&(1<<v)-1)];continue a}e.msg=\"invalid distance code\",a.mode=30;break e}if(y=65535&p,c<(v&=15)&&(u+=S[n++]<<c,(c+=8)<v&&(u+=S[n++]<<c,c+=8)),(y+=u&(1<<v)-1)>o){e.msg=\"invalid distance too far back\",a.mode=30;break e}if(u>>>=v,c-=v,y>(v=r-s)){if((v=y-v)>d&&a.sane){e.msg=\"invalid distance too far back\",a.mode=30;break e}if(x=0,z=f,0===_){if(x+=h-v,v<k){k-=v;do{E[r++]=f[x++]}while(--v);x=r-y,z=E}}else if(_<v){if(x+=h+_-v,(v-=_)<k){k-=v;do{E[r++]=f[x++]}while(--v);if(x=0,_<k){k-=v=_;do{E[r++]=f[x++]}while(--v);x=r-y,z=E}}}else if(x+=_-v,v<k){k-=v;do{E[r++]=f[x++]}while(--v);x=r-y,z=E}for(;k>2;)E[r++]=z[x++],E[r++]=z[x++],E[r++]=z[x++],k-=3;k&&(E[r++]=z[x++],k>1&&(E[r++]=z[x++]))}else{x=r-y;do{E[r++]=E[x++],E[r++]=E[x++],E[r++]=E[x++],k-=3}while(k>2);k&&(E[r++]=E[x++],k>1&&(E[r++]=E[x++]))}break}}break}}while(n<i&&r<l);n-=k=c>>3,u&=(1<<(c-=k<<3))-1,e.next_in=n,e.next_out=r,e.avail_in=n<i?i-n+5:5-(n-i),e.avail_out=r<l?l-r+257:257-(r-l),a.hold=u,a.bits=c}},function(e,t,a){\"use strict\";var n=a(2),i=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],r=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],s=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],l=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];e.exports=function(e,t,a,o,h,d,_,f){var u,c,b,g,m,w,p,v,k,y=f.bits,x=0,z=0,S=0,E=0,A=0,Z=0,O=0,R=0,B=0,T=0,N=null,D=0,U=new n.Buf16(16),I=new n.Buf16(16),F=null,L=0;for(x=0;x<=15;x++)U[x]=0;for(z=0;z<o;z++)U[t[a+z]]++;for(A=y,E=15;E>=1&&0===U[E];E--);if(A>E&&(A=E),0===E)return h[d++]=20971520,h[d++]=20971520,f.bits=1,0;for(S=1;S<E&&0===U[S];S++);for(A<S&&(A=S),R=1,x=1;x<=15;x++)if(R<<=1,(R-=U[x])<0)return-1;if(R>0&&(0===e||1!==E))return-1;for(I[1]=0,x=1;x<15;x++)I[x+1]=I[x]+U[x];for(z=0;z<o;z++)0!==t[a+z]&&(_[I[t[a+z]]++]=z);if(0===e?(N=F=_,w=19):1===e?(N=i,D-=257,F=r,L-=257,w=256):(N=s,F=l,w=-1),T=0,z=0,x=S,m=d,Z=A,O=0,b=-1,g=(B=1<<A)-1,1===e&&B>852||2===e&&B>592)return 1;for(;;){p=x-O,_[z]<w?(v=0,k=_[z]):_[z]>w?(v=F[L+_[z]],k=N[D+_[z]]):(v=96,k=0),u=1<<x-O,S=c=1<<Z;do{h[m+(T>>O)+(c-=u)]=p<<24|v<<16|k|0}while(0!==c);for(u=1<<x-1;T&u;)u>>=1;if(0!==u?(T&=u-1,T+=u):T=0,z++,0==--U[x]){if(x===E)break;x=t[a+_[z]]}if(x>A&&(T&g)!==b){for(0===O&&(O=A),m+=S,R=1<<(Z=x-O);Z+O<E&&!((R-=U[Z+O])<=0);)Z++,R<<=1;if(B+=1<<Z,1===e&&B>852||2===e&&B>592)return 1;h[b=T&g]=A<<24|Z<<16|m-d|0}}return 0!==T&&(h[m+T]=x-O<<24|64<<16|0),f.bits=A,0}},function(e,t,a){\"use strict\";a.r(t);var n=a(3),i=a.n(n),r=a(4),s=a(5),l=a(1),o=a.n(l),h=a(0);function d(e,t){var a=this;this.inflatedReady=e,this.deflatedReady=t,this._inflate=function(e){var t=new i.a,a=Object(s.inflateInit2)(t,15);if(a!==h.Z_OK)throw new Error(\"Problem initializing inflate stream: \"+o.a[a]);return function(a){if(void 0===a)return e();var n,i,r;t.input=a,t.next_in=0,t.avail_in=t.input.length;var l=!0;do{if(0===t.avail_out&&(t.output=new Uint8Array(16384),n=t.next_out=0,t.avail_out=16384),(i=Object(s.inflate)(t,h.Z_NO_FLUSH))!==h.Z_STREAM_END&&i!==h.Z_OK)throw new Error(\"inflate problem: \"+o.a[i]);t.next_out&&(0!==t.avail_out&&i!==h.Z_STREAM_END||(r=t.output.subarray(n,n=t.next_out),l=e(r)))}while(t.avail_in>0&&i!==h.Z_STREAM_END);return t.next_out>n&&(r=t.output.subarray(n,n=t.next_out),l=e(r)),l}}((function(e){return a.inflatedReady(e.buffer.slice(e.byteOffset,e.byteOffset+e.length))})),this._deflate=function(e){var t=new i.a,a=Object(r.deflateInit2)(t,h.Z_DEFAULT_COMPRESSION,h.Z_DEFLATED,15,8,h.Z_DEFAULT_STRATEGY);if(a!==h.Z_OK)throw new Error(\"Problem initializing deflate stream: \"+o.a[a]);return function(a){if(void 0===a)return e();var n,i,s;t.input=a,t.next_in=0,t.avail_in=t.input.length;var l=!0;do{if(0===t.avail_out&&(t.output=new Uint8Array(16384),s=t.next_out=0,t.avail_out=16384),(n=Object(r.deflate)(t,h.Z_SYNC_FLUSH))!==h.Z_STREAM_END&&n!==h.Z_OK)throw new Error(\"Deflate problem: \"+o.a[n]);0===t.avail_out&&t.next_out>s&&(i=t.output.subarray(s,s=t.next_out),l=e(i))}while((t.avail_in>0||0===t.avail_out)&&n!==h.Z_STREAM_END);return t.next_out>s&&(i=t.output.subarray(s,s=t.next_out),l=e(i)),l}}((function(e){return a.deflatedReady(e.buffer.slice(e.byteOffset,e.byteOffset+e.length))}))}d.prototype.inflate=function(e){this._inflate(new Uint8Array(e))},d.prototype.deflate=function(e){this._deflate(new Uint8Array(e))};var _=function(e,t){return{message:e,buffer:t}},f=new d((function(e){return self.postMessage(_(\"inflated_ready\",e),[e])}),(function(e){return self.postMessage(_(\"deflated_ready\",e),[e])}));self.onmessage=function(e){var t=e.data.message,a=e.data.buffer;switch(t){case\"start\":break;case\"inflate\":f.inflate(a);break;case\"deflate\":f.deflate(a)}}}]);"; //
// constants used for communication with the worker
//

var MESSAGE_INITIALIZE_WORKER = 'start';
var MESSAGE_INFLATE = 'inflate';
var MESSAGE_INFLATED_DATA_READY = 'inflated_ready';
var MESSAGE_DEFLATE = 'deflate';
var MESSAGE_DEFLATED_DATA_READY = 'deflated_ready';
var EOL = '\r\n';
var LINE_FEED = 10;
var CARRIAGE_RETURN = 13;
var LEFT_CURLY_BRACKET = 123;
var RIGHT_CURLY_BRACKET = 125;
var ASCII_PLUS = 43; // State tracking when constructing an IMAP command from buffers.

var BUFFER_STATE_LITERAL = 'literal';
var BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_1 = 'literal_length_1';
var BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_2 = 'literal_length_2';
var BUFFER_STATE_DEFAULT = 'default';
/**
 * How much time to wait since the last response until the connection is considered idling
 */

var TIMEOUT_ENTER_IDLE = 1000;
/**
 * Lower Bound for socket timeout to wait since the last data was written to a socket
 */

var TIMEOUT_SOCKET_LOWER_BOUND = 60000;
/**
 * Multiplier for socket timeout:
 *
 * We assume at least a GPRS connection with 115 kb/s = 14,375 kB/s tops, so 10 KB/s to be on
 * the safe side. We can timeout after a lower bound of 10s + (n KB / 10 KB/s). A 1 MB message
 * upload would be 110 seconds to wait for the timeout. 10 KB/s === 0.1 s/B
 */

var TIMEOUT_SOCKET_MULTIPLIER = 0.1;
/**
 * Creates a connection object to an IMAP server. Call `connect` method to inititate
 * the actual connection, the constructor only defines the properties but does not actually connect.
 *
 * @constructor
 *
 * @param {String} [host='localhost'] Hostname to conenct to
 * @param {Number} [port=143] Port number to connect to
 * @param {Object} [options] Optional options object
 * @param {Boolean} [options.useSecureTransport] Set to true, to use encrypted connection
 * @param {String} [options.compressionWorkerPath] offloads de-/compression computation to a web worker, this is the path to the browserified emailjs-compressor-worker.js
 */

var Imap = /*#__PURE__*/function () {
  function Imap(host, port) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, Imap);

    this.timeoutEnterIdle = TIMEOUT_ENTER_IDLE;
    this.timeoutSocketLowerBound = TIMEOUT_SOCKET_LOWER_BOUND;
    this.timeoutSocketMultiplier = TIMEOUT_SOCKET_MULTIPLIER;
    this.options = options;
    this.port = port || (this.options.useSecureTransport ? 993 : 143);
    this.host = host || 'localhost'; // Use a TLS connection. Port 993 also forces TLS.

    this.options.useSecureTransport = 'useSecureTransport' in this.options ? !!this.options.useSecureTransport : this.port === 993;
    this.secureMode = !!this.options.useSecureTransport; // Does the connection use SSL/TLS

    this._connectionReady = false; // Is the conection established and greeting is received from the server

    this._globalAcceptUntagged = {}; // Global handlers for unrelated responses (EXPUNGE, EXISTS etc.)

    this._clientQueue = []; // Queue of outgoing commands

    this._canSend = false; // Is it OK to send something to the server

    this._tagCounter = 0; // Counter to allow uniqueue imap tags

    this._currentCommand = false; // Current command that is waiting for response from the server

    this._idleTimer = false; // Timer waiting to enter idle

    this._socketTimeoutTimer = false; // Timer waiting to declare the socket dead starting from the last write

    this.compressed = false; // Is the connection compressed and needs inflating/deflating
    //
    // HELPERS
    //
    // As the server sends data in chunks, it needs to be split into separate lines. Helps parsing the input.

    this._incomingBuffers = [];
    this._bufferState = BUFFER_STATE_DEFAULT;
    this._literalRemaining = 0; //
    // Event placeholders, may be overriden with callback functions
    //

    this.oncert = null;
    this.onerror = null; // Irrecoverable error occurred. Connection to the server will be closed automatically.

    this.onready = null; // The connection to the server has been established and greeting is received

    this.onidle = null; // There are no more commands to process
  } // PUBLIC METHODS

  /**
   * Initiate a connection to the server. Wait for onready event
   *
   * @param {Object} Socket
   *     TESTING ONLY! The TCPSocket has a pretty nonsensical convenience constructor,
   *     which makes it hard to mock. For dependency-injection purposes, we use the
   *     Socket parameter to pass in a mock Socket implementation. Should be left blank
   *     in production use!
   * @returns {Promise} Resolves when socket is opened
   */


  _createClass(Imap, [{
    key: "connect",
    value: function connect() {
      var _this = this;

      var Socket = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : TCPSocket;
      return new Promise(function (resolve, reject) {
        _this.socket = Socket.open(_this.host, _this.port, {
          binaryType: 'arraybuffer',
          useSecureTransport: _this.secureMode,
          ca: _this.options.ca
        }); // allows certificate handling for platform w/o native tls support
        // oncert is non standard so setting it might throw if the socket object is immutable

        try {
          _this.socket.oncert = function (cert) {
            _this.oncert && _this.oncert(cert);
          };
        } catch (E) {} // Connection closing unexpected is an error


        _this.socket.onclose = function () {
          return _this._onError(new Error('Socket closed unexpectedly!'));
        };

        _this.socket.ondata = function (evt) {
          try {
            _this._onData(evt);
          } catch (err) {
            _this._onError(err);
          }
        }; // if an error happens during create time, reject the promise


        _this.socket.onerror = function (e) {
          reject(new Error('Could not open socket: ' + e.data.message));
        };

        _this.socket.onopen = function () {
          // use proper "irrecoverable error, tear down everything"-handler only after socket is open
          _this.socket.onerror = function (e) {
            return _this._onError(e);
          };

          resolve();
        };
      });
    }
    /**
     * Closes the connection to the server
     *
     * @returns {Promise} Resolves when the socket is closed
     */

  }, {
    key: "close",
    value: function close(error) {
      var _this2 = this;

      return new Promise(function (resolve) {
        var tearDown = function tearDown() {
          // fulfill pending promises
          _this2._clientQueue.forEach(function (cmd) {
            return cmd.callback(error);
          });

          if (_this2._currentCommand) {
            _this2._currentCommand.callback(error);
          }

          _this2._clientQueue = [];
          _this2._currentCommand = false;
          clearTimeout(_this2._idleTimer);
          _this2._idleTimer = null;
          clearTimeout(_this2._socketTimeoutTimer);
          _this2._socketTimeoutTimer = null;

          if (_this2.socket) {
            // remove all listeners
            _this2.socket.onopen = null;
            _this2.socket.onclose = null;
            _this2.socket.ondata = null;
            _this2.socket.onerror = null;

            try {
              _this2.socket.oncert = null;
            } catch (E) {}

            _this2.socket = null;
          }

          resolve();
        };

        _this2._disableCompression();

        if (!_this2.socket || _this2.socket.readyState !== 'open') {
          return tearDown();
        }

        _this2.socket.onclose = _this2.socket.onerror = tearDown; // we don't really care about the error here

        _this2.socket.close();
      });
    }
    /**
     * Send LOGOUT to the server.
     *
     * Use is discouraged!
     *
     * @returns {Promise} Resolves when connection is closed by server.
     */

  }, {
    key: "logout",
    value: function logout() {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3.socket.onclose = _this3.socket.onerror = function () {
          _this3.close('Client logging out').then(resolve)["catch"](reject);
        };

        _this3.enqueueCommand('LOGOUT');
      });
    }
    /**
     * Initiates TLS handshake
     */

  }, {
    key: "upgrade",
    value: function upgrade() {
      this.secureMode = true;
      this.socket.upgradeToSecure();
    }
    /**
     * Schedules a command to be sent to the server.
     * See https://github.com/emailjs/emailjs-imap-handler for request structure.
     * Do not provide a tag property, it will be set by the queue manager.
     *
     * To catch untagged responses use acceptUntagged property. For example, if
     * the value for it is 'FETCH' then the reponse includes 'payload.FETCH' property
     * that is an array including all listed * FETCH responses.
     *
     * @param {Object} request Structured request object
     * @param {Array} acceptUntagged a list of untagged responses that will be included in 'payload' property
     * @param {Object} [options] Optional data for the command payload
     * @returns {Promise} Promise that resolves when the corresponding response was received
     */

  }, {
    key: "enqueueCommand",
    value: function enqueueCommand(request, acceptUntagged, options) {
      var _this4 = this;

      if (typeof request === 'string') {
        request = {
          command: request
        };
      }

      acceptUntagged = [].concat(acceptUntagged || []).map(function (untagged) {
        return (untagged || '').toString().toUpperCase().trim();
      });
      var tag = 'W' + ++this._tagCounter;
      request.tag = tag;
      return new Promise(function (resolve, reject) {
        var data = {
          tag: tag,
          request: request,
          payload: acceptUntagged.length ? {} : undefined,
          callback: function callback(response) {
            if (_this4.isError(response)) {
              // add command and attributes for more clue what failed
              response.command = request.command;

              if (request.command !== 'login') {
                response.attributes = request.attributes;
              }

              return reject(response);
            } else if (['NO', 'BAD'].indexOf(propOr('', 'command', response).toUpperCase().trim()) >= 0) {
              var error = new Error(response.humanReadable || 'Error'); // add command and attributes for more clue what failed

              error.command = request.command;

              if (request.command !== 'login') {
                error.attributes = request.attributes;
              }

              if (response.code) {
                error.code = response.code;
              }

              return reject(error);
            }

            resolve(response);
          }
        }; // apply any additional options to the command

        Object.keys(options || {}).forEach(function (key) {
          data[key] = options[key];
        });
        acceptUntagged.forEach(function (command) {
          data.payload[command] = [];
        }); // if we're in priority mode (i.e. we ran commands in a precheck),
        // queue any commands BEFORE the command that contianed the precheck,
        // otherwise just queue command as usual

        var index = data.ctx ? _this4._clientQueue.indexOf(data.ctx) : -1;

        if (index >= 0) {
          data.tag += '.p';
          data.request.tag += '.p';

          _this4._clientQueue.splice(index, 0, data);
        } else {
          _this4._clientQueue.push(data);
        }

        if (_this4._canSend) {
          _this4._sendRequest();
        }
      });
    }
    /**
     *
     * @param commands
     * @param ctx
     * @returns {*}
     */

  }, {
    key: "getPreviouslyQueued",
    value: function getPreviouslyQueued(commands, ctx) {
      var startIndex = this._clientQueue.indexOf(ctx) - 1; // search backwards for the commands and return the first found

      for (var i = startIndex; i >= 0; i--) {
        if (isMatch(this._clientQueue[i])) {
          return this._clientQueue[i];
        }
      } // also check current command if no SELECT is queued


      if (isMatch(this._currentCommand)) {
        return this._currentCommand;
      }

      return false;

      function isMatch(data) {
        return data && data.request && commands.indexOf(data.request.command) >= 0;
      }
    }
    /**
     * Send data to the TCP socket
     * Arms a timeout waiting for a response from the server.
     *
     * @param {String} str Payload
     */

  }, {
    key: "send",
    value: function send(str) {
      var _this5 = this;

      var buffer = toTypedArray(str).buffer;
      var timeout = this.timeoutSocketLowerBound + Math.floor(buffer.byteLength * this.timeoutSocketMultiplier);
      clearTimeout(this._socketTimeoutTimer); // clear pending timeouts

      this._socketTimeoutTimer = setTimeout(function () {
        return _this5._onError(new Error(' Socket timed out!'));
      }, timeout); // arm the next timeout

      if (this.compressed) {
        this._sendCompressed(buffer);
      } else {
        if (!this.socket) {
          this._onError(new Error('Error :: Unexpected socket close'));
        } else {
          this.socket.send(buffer);
        }
      }
    }
    /**
     * Set a global handler for an untagged response. If currently processed command
     * has not listed untagged command it is forwarded to the global handler. Useful
     * with EXPUNGE, EXISTS etc.
     *
     * @param {String} command Untagged command name
     * @param {Function} callback Callback function with response object and continue callback function
     */

  }, {
    key: "setHandler",
    value: function setHandler(command, callback) {
      this._globalAcceptUntagged[command.toUpperCase().trim()] = callback;
    } // INTERNAL EVENTS

    /**
     * Error handler for the socket
     *
     * @event
     * @param {Event} evt Event object. See evt.data for the error
     */

  }, {
    key: "_onError",
    value: function _onError(evt) {
      var _this6 = this;

      var error;

      if (this.isError(evt)) {
        error = evt;
      } else if (evt && this.isError(evt.data)) {
        error = evt.data;
      } else {
        error = new Error(evt && evt.data && evt.data.message || evt.data || evt || 'Error');
      }

      this.logger.error(error); // always call onerror callback, no matter if close() succeeds or fails

      this.close(error).then(function () {
        _this6.onerror && _this6.onerror(error);
      }, function () {
        _this6.onerror && _this6.onerror(error);
      });
    }
    /**
     * Handler for incoming data from the server. The data is sent in arbitrary
     * chunks and can't be used directly so this function makes sure the data
     * is split into complete lines before the data is passed to the command
     * handler
     *
     * @param {Event} evt
     */

  }, {
    key: "_onData",
    value: function _onData(evt) {
      var _this7 = this;

      clearTimeout(this._socketTimeoutTimer); // reset the timeout on each data packet

      var timeout = this.timeoutSocketLowerBound + Math.floor(4096 * this.timeoutSocketMultiplier); // max packet size is 4096 bytes

      this._socketTimeoutTimer = setTimeout(function () {
        return _this7._onError(new Error(' Socket timed out!'));
      }, timeout);

      this._incomingBuffers.push(new Uint8Array(evt.data)); // append to the incoming buffer


      this._parseIncomingCommands(this._iterateIncomingBuffer()); // Consume the incoming buffer

    }
  }, {
    key: "_iterateIncomingBuffer",
    value: /*#__PURE__*/regeneratorRuntime.mark(function _iterateIncomingBuffer() {
      var buf, i, diff, start, latest, prevBuf, leftIdx, leftOfLeftCurly, LFidx, commandLength, command, index, uint8Array, remainingLength, excessLength;
      return regeneratorRuntime.wrap(function _iterateIncomingBuffer$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              buf = this._incomingBuffers[this._incomingBuffers.length - 1] || [];
              i = 0; // loop invariant:
              //   this._incomingBuffers starts with the beginning of incoming command.
              //   buf is shorthand for last element of this._incomingBuffers.
              //   buf[0..i-1] is part of incoming command.

            case 2:
              if (!(i < buf.length)) {
                _context.next = 49;
                break;
              }

              _context.t0 = this._bufferState;
              _context.next = _context.t0 === BUFFER_STATE_LITERAL ? 6 : _context.t0 === BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_2 ? 11 : _context.t0 === BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_1 ? 13 : 18;
              break;

            case 6:
              diff = Math.min(buf.length - i, this._literalRemaining);
              this._literalRemaining -= diff;
              i += diff;

              if (this._literalRemaining === 0) {
                this._bufferState = BUFFER_STATE_DEFAULT;
              }

              return _context.abrupt("continue", 2);

            case 11:
              if (i < buf.length) {
                if (buf[i] === CARRIAGE_RETURN) {
                  this._literalRemaining = Number(fromTypedArray(this._lengthBuffer)) + 2; // for CRLF

                  this._bufferState = BUFFER_STATE_LITERAL;
                } else {
                  this._bufferState = BUFFER_STATE_DEFAULT;
                }

                delete this._lengthBuffer;
              }

              return _context.abrupt("continue", 2);

            case 13:
              start = i;

              while (i < buf.length && buf[i] >= 48 && buf[i] <= 57) {
                // digits
                i++;
              }

              if (start !== i) {
                latest = buf.subarray(start, i);
                prevBuf = this._lengthBuffer;
                this._lengthBuffer = new Uint8Array(prevBuf.length + latest.length);

                this._lengthBuffer.set(prevBuf);

                this._lengthBuffer.set(latest, prevBuf.length);
              }

              if (i < buf.length) {
                if (this._lengthBuffer.length > 0 && buf[i] === RIGHT_CURLY_BRACKET) {
                  this._bufferState = BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_2;
                } else {
                  delete this._lengthBuffer;
                  this._bufferState = BUFFER_STATE_DEFAULT;
                }

                i++;
              }

              return _context.abrupt("continue", 2);

            case 18:
              // find literal length
              leftIdx = buf.indexOf(LEFT_CURLY_BRACKET, i);

              if (!(leftIdx > -1)) {
                _context.next = 26;
                break;
              }

              leftOfLeftCurly = new Uint8Array(buf.buffer, i, leftIdx - i);

              if (!(leftOfLeftCurly.indexOf(LINE_FEED) === -1)) {
                _context.next = 26;
                break;
              }

              i = leftIdx + 1;
              this._lengthBuffer = new Uint8Array(0);
              this._bufferState = BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_1;
              return _context.abrupt("continue", 2);

            case 26:
              // find end of command
              LFidx = buf.indexOf(LINE_FEED, i);

              if (!(LFidx > -1)) {
                _context.next = 46;
                break;
              }

              if (LFidx < buf.length - 1) {
                this._incomingBuffers[this._incomingBuffers.length - 1] = new Uint8Array(buf.buffer, 0, LFidx + 1);
              }

              commandLength = this._incomingBuffers.reduce(function (prev, curr) {
                return prev + curr.length;
              }, 0) - 2; // 2 for CRLF

              command = new Uint8Array(commandLength);
              index = 0;

              while (this._incomingBuffers.length > 0) {
                uint8Array = this._incomingBuffers.shift();
                remainingLength = commandLength - index;

                if (uint8Array.length > remainingLength) {
                  excessLength = uint8Array.length - remainingLength;
                  uint8Array = uint8Array.subarray(0, -excessLength);

                  if (this._incomingBuffers.length > 0) {
                    this._incomingBuffers = [];
                  }
                }

                command.set(uint8Array, index);
                index += uint8Array.length;
              }

              _context.next = 35;
              return command;

            case 35:
              if (!(LFidx < buf.length - 1)) {
                _context.next = 41;
                break;
              }

              buf = new Uint8Array(buf.subarray(LFidx + 1));

              this._incomingBuffers.push(buf);

              i = 0;
              _context.next = 44;
              break;

            case 41:
              // clear the timeout when an entire command has arrived
              // and not waiting on more data for next command
              clearTimeout(this._socketTimeoutTimer);
              this._socketTimeoutTimer = null;
              return _context.abrupt("return");

            case 44:
              _context.next = 47;
              break;

            case 46:
              return _context.abrupt("return");

            case 47:
              _context.next = 2;
              break;

            case 49:
            case "end":
              return _context.stop();
          }
        }
      }, _iterateIncomingBuffer, this);
    }) // PRIVATE METHODS

    /**
     * Processes a command from the queue. The command is parsed and feeded to a handler
     */

  }, {
    key: "_parseIncomingCommands",
    value: function _parseIncomingCommands(commands) {
      var _iterator = _createForOfIteratorHelper(commands),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var command = _step.value;

          this._clearIdle();
          /*
           * The "+"-tagged response is a special case:
           * Either the server can asks for the next chunk of data, e.g. for the AUTHENTICATE command.
           *
           * Or there was an error in the XOAUTH2 authentication, for which SASL initial client response extension
           * dictates the client sends an empty EOL response to the challenge containing the error message.
           *
           * Details on "+"-tagged response:
           *   https://tools.ietf.org/html/rfc3501#section-2.2.1
           */
          //


          if (command[0] === ASCII_PLUS) {
            if (this._currentCommand.data.length) {
              // feed the next chunk of data
              var chunk = this._currentCommand.data.shift();

              chunk += !this._currentCommand.data.length ? EOL : ''; // EOL if there's nothing more to send

              this.send(chunk);
            } else if (this._currentCommand.errorResponseExpectsEmptyLine) {
              this.send(EOL); // XOAUTH2 empty response, error will be reported when server continues with NO response
            }

            continue;
          }

          var response;

          try {
            var valueAsString = this._currentCommand.request && this._currentCommand.request.valueAsString;
            response = parser(command, {
              valueAsString: valueAsString
            });
            this.logger.debug('S:', function () {
              return compiler(response, false, true);
            });
          } catch (e) {
            this.logger.error('Error parsing imap command!', JSON.stringify({
              response: response,
              command: command
            }));
            return this._onError(e);
          }

          this._processResponse(response);

          this._handleResponse(response); // first response from the server, connection is now usable


          if (!this._connectionReady) {
            this._connectionReady = true;
            this.onready && this.onready();
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    /**
     * Feeds a parsed response object to an appropriate handler
     *
     * @param {Object} response Parsed command object
     */

  }, {
    key: "_handleResponse",
    value: function _handleResponse(response) {
      var command = propOr('', 'command', response).toUpperCase().trim();

      if (!this._currentCommand) {
        // unsolicited untagged response
        if (response.tag === '*' && command in this._globalAcceptUntagged) {
          this._globalAcceptUntagged[command](response);

          this._canSend = true;

          this._sendRequest();
        }
      } else if (this._currentCommand.payload && response.tag === '*' && command in this._currentCommand.payload) {
        // expected untagged response
        this._currentCommand.payload[command].push(response);
      } else if (response.tag === '*' && command in this._globalAcceptUntagged) {
        // unexpected untagged response
        this._globalAcceptUntagged[command](response);
      } else if (response.tag === this._currentCommand.tag) {
        // tagged response
        if (this._currentCommand.payload && Object.keys(this._currentCommand.payload).length) {
          response.payload = this._currentCommand.payload;
        }

        this._currentCommand.callback(response);

        this._canSend = true;

        this._sendRequest();
      }
    }
    /**
     * Sends a command from client queue to the server.
     */

  }, {
    key: "_sendRequest",
    value: function _sendRequest() {
      var _this8 = this;

      if (!this._clientQueue.length) {
        return this._enterIdle();
      }

      this._clearIdle(); // an operation was made in the precheck, no need to restart the queue manually


      this._restartQueue = false;
      var command = this._clientQueue[0];

      if (typeof command.precheck === 'function') {
        // remember the context
        var context = command;
        var precheck = context.precheck;
        delete context.precheck; // we need to restart the queue handling if no operation was made in the precheck

        this._restartQueue = true; // invoke the precheck command and resume normal operation after the promise resolves

        precheck(context).then(function () {
          // we're done with the precheck
          if (_this8._restartQueue) {
            // we need to restart the queue handling
            _this8._sendRequest();
          }
        })["catch"](function (err) {
          // precheck failed, so we remove the initial command
          // from the queue, invoke its callback and resume normal operation
          var cmd;

          var index = _this8._clientQueue.indexOf(context);

          if (index >= 0) {
            cmd = _this8._clientQueue.splice(index, 1)[0];
          }

          if (cmd && cmd.callback) {
            cmd.callback(err);
            _this8._canSend = true;

            _this8._parseIncomingCommands(_this8._iterateIncomingBuffer()); // Consume the rest of the incoming buffer


            _this8._sendRequest(); // continue sending

          }
        });
        return;
      }

      this._canSend = false;
      this._currentCommand = this._clientQueue.shift();

      try {
        this._currentCommand.data = compiler(this._currentCommand.request, true);
        this.logger.debug('C:', function () {
          return compiler(_this8._currentCommand.request, false, true);
        }); // excludes passwords etc.
      } catch (e) {
        this.logger.error('Error compiling imap command!', this._currentCommand.request);
        return this._onError(new Error('Error compiling imap command!'));
      }

      var data = this._currentCommand.data.shift();

      this.send(data + (!this._currentCommand.data.length ? EOL : ''));
      return this.waitDrain;
    }
    /**
     * Emits onidle, noting to do currently
     */

  }, {
    key: "_enterIdle",
    value: function _enterIdle() {
      var _this9 = this;

      clearTimeout(this._idleTimer);
      this._idleTimer = setTimeout(function () {
        return _this9.onidle && _this9.onidle();
      }, this.timeoutEnterIdle);
    }
    /**
     * Cancel idle timer
     */

  }, {
    key: "_clearIdle",
    value: function _clearIdle() {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
    /**
     * Method processes a response into an easier to handle format.
     * Add untagged numbered responses (e.g. FETCH) into a nicely feasible form
     * Checks if a response includes optional response codes
     * and copies these into separate properties. For example the
     * following response includes a capability listing and a human
     * readable message:
     *
     *     * OK [CAPABILITY ID NAMESPACE] All ready
     *
     * This method adds a 'capability' property with an array value ['ID', 'NAMESPACE']
     * to the response object. Additionally 'All ready' is added as 'humanReadable' property.
     *
     * See possiblem IMAP Response Codes at https://tools.ietf.org/html/rfc5530
     *
     * @param {Object} response Parsed response object
     */

  }, {
    key: "_processResponse",
    value: function _processResponse(response) {
      var command = propOr('', 'command', response).toUpperCase().trim(); // no attributes

      if (!response || !response.attributes || !response.attributes.length) {
        return;
      } // untagged responses w/ sequence numbers


      if (response.tag === '*' && /^\d+$/.test(response.command) && response.attributes[0].type === 'ATOM') {
        response.nr = Number(response.command);
        response.command = (response.attributes.shift().value || '').toString().toUpperCase().trim();
      } // no optional response code


      if (['OK', 'NO', 'BAD', 'BYE', 'PREAUTH'].indexOf(command) < 0) {
        return;
      } // If last element of the response is TEXT then this is for humans


      if (response.attributes[response.attributes.length - 1].type === 'TEXT') {
        response.humanReadable = response.attributes[response.attributes.length - 1].value;
      } // Parse and format ATOM values


      if (response.attributes[0].type === 'ATOM' && response.attributes[0].section) {
        var option = response.attributes[0].section.map(function (key) {
          if (!key) {
            return;
          }

          if (Array.isArray(key)) {
            return key.map(function (key) {
              return (key.value || '').toString().trim();
            });
          } else {
            return (key.value || '').toString().toUpperCase().trim();
          }
        });
        var key = option.shift();
        response.code = key;

        if (option.length === 1) {
          response[key.toLowerCase()] = option[0];
        } else if (option.length > 1) {
          response[key.toLowerCase()] = option;
        }
      }
    }
    /**
     * Checks if a value is an Error object
     *
     * @param {Mixed} value Value to be checked
     * @return {Boolean} returns true if the value is an Error
     */

  }, {
    key: "isError",
    value: function isError(value) {
      return !!Object.prototype.toString.call(value).match(/Error\]$/);
    } // COMPRESSION RELATED METHODS

    /**
     * Sets up deflate/inflate for the IO
     */

  }, {
    key: "enableCompression",
    value: function enableCompression() {
      var _this10 = this;

      this._socketOnData = this.socket.ondata;
      this.compressed = true;

      if (typeof window !== 'undefined' && window.Worker) {
        this._compressionWorker = new Worker(URL.createObjectURL(new Blob([CompressionBlob])));

        this._compressionWorker.onmessage = function (e) {
          var message = e.data.message;
          var data = e.data.buffer;

          switch (message) {
            case MESSAGE_INFLATED_DATA_READY:
              _this10._socketOnData({
                data: data
              });

              break;

            case MESSAGE_DEFLATED_DATA_READY:
              _this10.waitDrain = _this10.socket.send(data);
              break;
          }
        };

        this._compressionWorker.onerror = function (e) {
          _this10._onError(new Error('Error handling compression web worker: ' + e.message));
        };

        this._compressionWorker.postMessage(createMessage(MESSAGE_INITIALIZE_WORKER));
      } else {
        var inflatedReady = function inflatedReady(buffer) {
          _this10._socketOnData({
            data: buffer
          });
        };

        var deflatedReady = function deflatedReady(buffer) {
          _this10.waitDrain = _this10.socket.send(buffer);
        };

        this._compression = new Compression(inflatedReady, deflatedReady);
      } // override data handler, decompress incoming data


      this.socket.ondata = function (evt) {
        if (!_this10.compressed) {
          return;
        }

        if (_this10._compressionWorker) {
          _this10._compressionWorker.postMessage(createMessage(MESSAGE_INFLATE, evt.data), [evt.data]);
        } else {
          _this10._compression.inflate(evt.data);
        }
      };
    }
    /**
     * Undoes any changes related to compression. This only be called when closing the connection
     */

  }, {
    key: "_disableCompression",
    value: function _disableCompression() {
      if (!this.compressed) {
        return;
      }

      this.compressed = false;
      this.socket.ondata = this._socketOnData;
      this._socketOnData = null;

      if (this._compressionWorker) {
        // terminate the worker
        this._compressionWorker.terminate();

        this._compressionWorker = null;
      }
    }
    /**
     * Outgoing payload needs to be compressed and sent to socket
     *
     * @param {ArrayBuffer} buffer Outgoing uncompressed arraybuffer
     */

  }, {
    key: "_sendCompressed",
    value: function _sendCompressed(buffer) {
      // deflate
      if (this._compressionWorker) {
        this._compressionWorker.postMessage(createMessage(MESSAGE_DEFLATE, buffer), [buffer]);
      } else {
        this._compression.deflate(buffer);
      }
    }
  }]);

  return Imap;
}();

export { Imap as default };

var createMessage = function createMessage(message, buffer) {
  return {
    message: message,
    buffer: buffer
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbWFwLmpzIl0sIm5hbWVzIjpbInByb3BPciIsIlRDUFNvY2tldCIsInRvVHlwZWRBcnJheSIsImZyb21UeXBlZEFycmF5IiwicGFyc2VyIiwiY29tcGlsZXIiLCJDb21wcmVzc2lvbiIsIk1FU1NBR0VfSU5JVElBTElaRV9XT1JLRVIiLCJNRVNTQUdFX0lORkxBVEUiLCJNRVNTQUdFX0lORkxBVEVEX0RBVEFfUkVBRFkiLCJNRVNTQUdFX0RFRkxBVEUiLCJNRVNTQUdFX0RFRkxBVEVEX0RBVEFfUkVBRFkiLCJFT0wiLCJMSU5FX0ZFRUQiLCJDQVJSSUFHRV9SRVRVUk4iLCJMRUZUX0NVUkxZX0JSQUNLRVQiLCJSSUdIVF9DVVJMWV9CUkFDS0VUIiwiQVNDSUlfUExVUyIsIkJVRkZFUl9TVEFURV9MSVRFUkFMIiwiQlVGRkVSX1NUQVRFX1BPU1NJQkxZX0xJVEVSQUxfTEVOR1RIXzEiLCJCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMiIsIkJVRkZFUl9TVEFURV9ERUZBVUxUIiwiVElNRU9VVF9FTlRFUl9JRExFIiwiVElNRU9VVF9TT0NLRVRfTE9XRVJfQk9VTkQiLCJUSU1FT1VUX1NPQ0tFVF9NVUxUSVBMSUVSIiwiSW1hcCIsImhvc3QiLCJwb3J0Iiwib3B0aW9ucyIsInRpbWVvdXRFbnRlcklkbGUiLCJ0aW1lb3V0U29ja2V0TG93ZXJCb3VuZCIsInRpbWVvdXRTb2NrZXRNdWx0aXBsaWVyIiwidXNlU2VjdXJlVHJhbnNwb3J0Iiwic2VjdXJlTW9kZSIsIl9jb25uZWN0aW9uUmVhZHkiLCJfZ2xvYmFsQWNjZXB0VW50YWdnZWQiLCJfY2xpZW50UXVldWUiLCJfY2FuU2VuZCIsIl90YWdDb3VudGVyIiwiX2N1cnJlbnRDb21tYW5kIiwiX2lkbGVUaW1lciIsIl9zb2NrZXRUaW1lb3V0VGltZXIiLCJjb21wcmVzc2VkIiwiX2luY29taW5nQnVmZmVycyIsIl9idWZmZXJTdGF0ZSIsIl9saXRlcmFsUmVtYWluaW5nIiwib25jZXJ0Iiwib25lcnJvciIsIm9ucmVhZHkiLCJvbmlkbGUiLCJTb2NrZXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInNvY2tldCIsIm9wZW4iLCJiaW5hcnlUeXBlIiwiY2EiLCJjZXJ0IiwiRSIsIm9uY2xvc2UiLCJfb25FcnJvciIsIkVycm9yIiwib25kYXRhIiwiZXZ0IiwiX29uRGF0YSIsImVyciIsImUiLCJkYXRhIiwibWVzc2FnZSIsIm9ub3BlbiIsImVycm9yIiwidGVhckRvd24iLCJmb3JFYWNoIiwiY21kIiwiY2FsbGJhY2siLCJjbGVhclRpbWVvdXQiLCJfZGlzYWJsZUNvbXByZXNzaW9uIiwicmVhZHlTdGF0ZSIsImNsb3NlIiwidGhlbiIsImVucXVldWVDb21tYW5kIiwidXBncmFkZVRvU2VjdXJlIiwicmVxdWVzdCIsImFjY2VwdFVudGFnZ2VkIiwiY29tbWFuZCIsImNvbmNhdCIsIm1hcCIsInVudGFnZ2VkIiwidG9TdHJpbmciLCJ0b1VwcGVyQ2FzZSIsInRyaW0iLCJ0YWciLCJwYXlsb2FkIiwibGVuZ3RoIiwidW5kZWZpbmVkIiwicmVzcG9uc2UiLCJpc0Vycm9yIiwiYXR0cmlidXRlcyIsImluZGV4T2YiLCJodW1hblJlYWRhYmxlIiwiY29kZSIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJpbmRleCIsImN0eCIsInNwbGljZSIsInB1c2giLCJfc2VuZFJlcXVlc3QiLCJjb21tYW5kcyIsInN0YXJ0SW5kZXgiLCJpIiwiaXNNYXRjaCIsInN0ciIsImJ1ZmZlciIsInRpbWVvdXQiLCJNYXRoIiwiZmxvb3IiLCJieXRlTGVuZ3RoIiwic2V0VGltZW91dCIsIl9zZW5kQ29tcHJlc3NlZCIsInNlbmQiLCJsb2dnZXIiLCJVaW50OEFycmF5IiwiX3BhcnNlSW5jb21pbmdDb21tYW5kcyIsIl9pdGVyYXRlSW5jb21pbmdCdWZmZXIiLCJidWYiLCJkaWZmIiwibWluIiwiTnVtYmVyIiwiX2xlbmd0aEJ1ZmZlciIsInN0YXJ0IiwibGF0ZXN0Iiwic3ViYXJyYXkiLCJwcmV2QnVmIiwic2V0IiwibGVmdElkeCIsImxlZnRPZkxlZnRDdXJseSIsIkxGaWR4IiwiY29tbWFuZExlbmd0aCIsInJlZHVjZSIsInByZXYiLCJjdXJyIiwidWludDhBcnJheSIsInNoaWZ0IiwicmVtYWluaW5nTGVuZ3RoIiwiZXhjZXNzTGVuZ3RoIiwiX2NsZWFySWRsZSIsImNodW5rIiwiZXJyb3JSZXNwb25zZUV4cGVjdHNFbXB0eUxpbmUiLCJ2YWx1ZUFzU3RyaW5nIiwiZGVidWciLCJKU09OIiwic3RyaW5naWZ5IiwiX3Byb2Nlc3NSZXNwb25zZSIsIl9oYW5kbGVSZXNwb25zZSIsIl9lbnRlcklkbGUiLCJfcmVzdGFydFF1ZXVlIiwicHJlY2hlY2siLCJjb250ZXh0Iiwid2FpdERyYWluIiwidGVzdCIsInR5cGUiLCJuciIsInZhbHVlIiwic2VjdGlvbiIsIm9wdGlvbiIsIkFycmF5IiwiaXNBcnJheSIsInRvTG93ZXJDYXNlIiwicHJvdG90eXBlIiwiY2FsbCIsIm1hdGNoIiwiX3NvY2tldE9uRGF0YSIsIndpbmRvdyIsIldvcmtlciIsIl9jb21wcmVzc2lvbldvcmtlciIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsIkJsb2IiLCJDb21wcmVzc2lvbkJsb2IiLCJvbm1lc3NhZ2UiLCJwb3N0TWVzc2FnZSIsImNyZWF0ZU1lc3NhZ2UiLCJpbmZsYXRlZFJlYWR5IiwiZGVmbGF0ZWRSZWFkeSIsIl9jb21wcmVzc2lvbiIsImluZmxhdGUiLCJ0ZXJtaW5hdGUiLCJkZWZsYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxTQUFTQSxNQUFULFFBQXVCLE9BQXZCO0FBQ0EsT0FBT0MsU0FBUCxNQUFzQixvQkFBdEI7QUFDQSxTQUFTQyxZQUFULEVBQXVCQyxjQUF2QixRQUE2QyxVQUE3QztBQUNBLFNBQVNDLE1BQVQsRUFBaUJDLFFBQWpCLFFBQWlDLHNCQUFqQztBQUNBLE9BQU9DLFdBQVAsTUFBd0IsZUFBeEI7OzttMXZDQUdBO0FBQ0E7QUFDQTs7QUFDQSxJQUFNQyx5QkFBeUIsR0FB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OztXQUNFLHlCQUFpQjlELE1BQWpCLEVBQXlCO0FBQ3ZCO0FBQ0EsVUFBSSxLQUFLOEQsa0JBQVQsRUFBNkI7QUFDM0IsYUFBS0Esa0JBQUwsQ0FBd0JNLFdBQXhCLENBQW9DQyxhQUFhLENBQUM5SyxlQUFELEVBQWtCeUcsTUFBbEIsQ0FBakQsRUFBNEUsQ0FBQ0EsTUFBRCxDQUE1RTtBQUNELE9BRkQsTUFFTztBQUNMLGFBQUt3RSxZQUFMLENBQWtCRyxPQUFsQixDQUEwQjNFLE1BQTFCO0FBQ0Q7QUFDRjs7Ozs7O1NBeHhCa0IxRixJOztBQTJ4QnJCLElBQU0rSixhQUFhLEdBQUcsU0FBaEJBLGFBQWdCLENBQUNuSCxPQUFELEVBQVU4QyxNQUFWO0FBQUEsU0FBc0I7QUFBRTlDLElBQUFBLE9BQU8sRUFBUEEsT0FBRjtBQUFXOEMsSUFBQUEsTUFBTSxFQUFOQTtBQUFYLEdBQXRCO0FBQUEsQ0FBdEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwcm9wT3IgfSBmcm9tICdyYW1kYSdcbmltcG9ydCBUQ1BTb2NrZXQgZnJvbSAnZW1haWxqcy10Y3Atc29ja2V0J1xuaW1wb3J0IHsgdG9UeXBlZEFycmF5LCBmcm9tVHlwZWRBcnJheSB9IGZyb20gJy4vY29tbW9uJ1xuaW1wb3J0IHsgcGFyc2VyLCBjb21waWxlciB9IGZyb20gJ2VtYWlsanMtaW1hcC1oYW5kbGVyJ1xuaW1wb3J0IENvbXByZXNzaW9uIGZyb20gJy4vY29tcHJlc3Npb24nXG5pbXBvcnQgQ29tcHJlc3Npb25CbG9iIGZyb20gJy4uL3Jlcy9jb21wcmVzc2lvbi53b3JrZXIuYmxvYidcblxuLy9cbi8vIGNvbnN0YW50cyB1c2VkIGZvciBjb21tdW5pY2F0aW9uIHdpdGggdGhlIHdvcmtlclxuLy9cbmNvbnN0IE1FU1NBR0VfSU5JVElBTElaRV9XT1JLRVIgPSAnc3RhcnQnXG5jb25zdCBNRVNTQUdFX0lORkxBVEUgPSAnaW5mbGF0ZSdcbmNvbnN0IE1FU1NBR0VfSU5GTEFURURfREFUQV9SRUFEWSA9ICdpbmZsYXRlZF9yZWFkeSdcbmNvbnN0IE1FU1NBR0VfREVGTEFURSA9ICdkZWZsYXRlJ1xuY29uc3QgTUVTU0FHRV9ERUZMQVRFRF9EQVRBX1JFQURZID0gJ2RlZmxhdGVkX3JlYWR5J1xuXG5jb25zdCBFT0wgPSAnXFxyXFxuJ1xuY29uc3QgTElORV9GRUVEID0gMTBcbmNvbnN0IENBUlJJQUdFX1JFVFVSTiA9IDEzXG5jb25zdCBMRUZUX0NVUkxZX0JSQUNLRVQgPSAxMjNcbmNvbnN0IFJJR0hUX0NVUkxZX0JSQUNLRVQgPSAxMjVcblxuY29uc3QgQVNDSUlfUExVUyA9IDQzXG5cbi8vIFN0YXRlIHRyYWNraW5nIHdoZW4gY29uc3RydWN0aW5nIGFuIElNQVAgY29tbWFuZCBmcm9tIGJ1ZmZlcnMuXG5jb25zdCBCVUZGRVJfU1RBVEVfTElURVJBTCA9ICdsaXRlcmFsJ1xuY29uc3QgQlVGRkVSX1NUQVRFX1BPU1NJQkxZX0xJVEVSQUxfTEVOR1RIXzEgPSAnbGl0ZXJhbF9sZW5ndGhfMSdcbmNvbnN0IEJVRkZFUl9TVEFURV9QT1NTSUJMWV9MSVRFUkFMX0xFTkdUSF8yID0gJ2xpdGVyYWxfbGVuZ3RoXzInXG5jb25zdCBCVUZGRVJfU1RBVEVfREVGQVVMVCA9ICdkZWZhdWx0J1xuXG4vKipcbiAqIEhvdyBtdWNoIHRpbWUgdG8gd2FpdCBzaW5jZSB0aGUgbGFzdCByZXNwb25zZSB1bnRpbCB0aGUgY29ubmVjdGlvbiBpcyBjb25zaWRlcmVkIGlkbGluZ1xuICovXG5jb25zdCBUSU1FT1VUX0VOVEVSX0lETEUgPSAxMDAwXG5cbi8qKlxuICogTG93ZXIgQm91bmQgZm9yIHNvY2tldCB0aW1lb3V0IHRvIHdhaXQgc2luY2UgdGhlIGxhc3QgZGF0YSB3YXMgd3JpdHRlbiB0byBhIHNvY2tldFxuICovXG5jb25zdCBUSU1FT1VUX1NPQ0tFVF9MT1dFUl9CT1VORCA9IDYwMDAwXG5cbi8qKlxuICogTXVsdGlwbGllciBmb3Igc29ja2V0IHRpbWVvdXQ6XG4gKlxuICogV2UgYXNzdW1lIGF0IGxlYXN0IGEgR1BSUyBjb25uZWN0aW9uIHdpdGggMTE1IGtiL3MgPSAxNCwzNzUga0IvcyB0b3BzLCBzbyAxMCBLQi9zIHRvIGJlIG9uXG4gKiB0aGUgc2FmZSBzaWRlLiBXZSBjYW4gdGltZW91dCBhZnRlciBhIGxvd2VyIGJvdW5kIG9mIDEwcyArIChuIEtCIC8gMTAgS0IvcykuIEEgMSBNQiBtZXNzYWdlXG4gKiB1cGxvYWQgd291bGQgYmUgMTEwIHNlY29uZHMgdG8gd2FpdCBmb3IgdGhlIHRpbWVvdXQuIDEwIEtCL3MgPT09IDAuMSBzL0JcbiAqL1xuY29uc3QgVElNRU9VVF9TT0NLRVRfTVVMVElQTElFUiA9IDAuMVxuXG4vKipcbiAqIENyZWF0ZXMgYSBjb25uZWN0aW9uIG9iamVjdCB0byBhbiBJTUFQIHNlcnZlci4gQ2FsbCBgY29ubmVjdGAgbWV0aG9kIHRvIGluaXRpdGF0ZVxuICogdGhlIGFjdHVhbCBjb25uZWN0aW9uLCB0aGUgY29uc3RydWN0b3Igb25seSBkZWZpbmVzIHRoZSBwcm9wZXJ0aWVzIGJ1dCBkb2VzIG5vdCBhY3R1YWxseSBjb25uZWN0LlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBbaG9zdD0nbG9jYWxob3N0J10gSG9zdG5hbWUgdG8gY29uZW5jdCB0b1xuICogQHBhcmFtIHtOdW1iZXJ9IFtwb3J0PTE0M10gUG9ydCBudW1iZXIgdG8gY29ubmVjdCB0b1xuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25hbCBvcHRpb25zIG9iamVjdFxuICogQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy51c2VTZWN1cmVUcmFuc3BvcnRdIFNldCB0byB0cnVlLCB0byB1c2UgZW5jcnlwdGVkIGNvbm5lY3Rpb25cbiAqIEBwYXJhbSB7U3RyaW5nfSBbb3B0aW9ucy5jb21wcmVzc2lvbldvcmtlclBhdGhdIG9mZmxvYWRzIGRlLS9jb21wcmVzc2lvbiBjb21wdXRhdGlvbiB0byBhIHdlYiB3b3JrZXIsIHRoaXMgaXMgdGhlIHBhdGggdG8gdGhlIGJyb3dzZXJpZmllZCBlbWFpbGpzLWNvbXByZXNzb3Itd29ya2VyLmpzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEltYXAge1xuICBjb25zdHJ1Y3RvciAoaG9zdCwgcG9ydCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy50aW1lb3V0RW50ZXJJZGxlID0gVElNRU9VVF9FTlRFUl9JRExFXG4gICAgdGhpcy50aW1lb3V0U29ja2V0TG93ZXJCb3VuZCA9IFRJTUVPVVRfU09DS0VUX0xPV0VSX0JPVU5EXG4gICAgdGhpcy50aW1lb3V0U29ja2V0TXVsdGlwbGllciA9IFRJTUVPVVRfU09DS0VUX01VTFRJUExJRVJcblxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcblxuICAgIHRoaXMucG9ydCA9IHBvcnQgfHwgKHRoaXMub3B0aW9ucy51c2VTZWN1cmVUcmFuc3BvcnQgPyA5OTMgOiAxNDMpXG4gICAgdGhpcy5ob3N0ID0gaG9zdCB8fCAnbG9jYWxob3N0J1xuXG4gICAgLy8gVXNlIGEgVExTIGNvbm5lY3Rpb24uIFBvcnQgOTkzIGFsc28gZm9yY2VzIFRMUy5cbiAgICB0aGlzLm9wdGlvbnMudXNlU2VjdXJlVHJhbnNwb3J0ID0gJ3VzZVNlY3VyZVRyYW5zcG9ydCcgaW4gdGhpcy5vcHRpb25zID8gISF0aGlzLm9wdGlvbnMudXNlU2VjdXJlVHJhbnNwb3J0IDogdGhpcy5wb3J0ID09PSA5OTNcblxuICAgIHRoaXMuc2VjdXJlTW9kZSA9ICEhdGhpcy5vcHRpb25zLnVzZVNlY3VyZVRyYW5zcG9ydCAvLyBEb2VzIHRoZSBjb25uZWN0aW9uIHVzZSBTU0wvVExTXG5cbiAgICB0aGlzLl9jb25uZWN0aW9uUmVhZHkgPSBmYWxzZSAvLyBJcyB0aGUgY29uZWN0aW9uIGVzdGFibGlzaGVkIGFuZCBncmVldGluZyBpcyByZWNlaXZlZCBmcm9tIHRoZSBzZXJ2ZXJcblxuICAgIHRoaXMuX2dsb2JhbEFjY2VwdFVudGFnZ2VkID0ge30gLy8gR2xvYmFsIGhhbmRsZXJzIGZvciB1bnJlbGF0ZWQgcmVzcG9uc2VzIChFWFBVTkdFLCBFWElTVFMgZXRjLilcblxuICAgIHRoaXMuX2NsaWVudFF1ZXVlID0gW10gLy8gUXVldWUgb2Ygb3V0Z29pbmcgY29tbWFuZHNcbiAgICB0aGlzLl9jYW5TZW5kID0gZmFsc2UgLy8gSXMgaXQgT0sgdG8gc2VuZCBzb21ldGhpbmcgdG8gdGhlIHNlcnZlclxuICAgIHRoaXMuX3RhZ0NvdW50ZXIgPSAwIC8vIENvdW50ZXIgdG8gYWxsb3cgdW5pcXVldWUgaW1hcCB0YWdzXG4gICAgdGhpcy5fY3VycmVudENvbW1hbmQgPSBmYWxzZSAvLyBDdXJyZW50IGNvbW1hbmQgdGhhdCBpcyB3YWl0aW5nIGZvciByZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXJcblxuICAgIHRoaXMuX2lkbGVUaW1lciA9IGZhbHNlIC8vIFRpbWVyIHdhaXRpbmcgdG8gZW50ZXIgaWRsZVxuICAgIHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lciA9IGZhbHNlIC8vIFRpbWVyIHdhaXRpbmcgdG8gZGVjbGFyZSB0aGUgc29ja2V0IGRlYWQgc3RhcnRpbmcgZnJvbSB0aGUgbGFzdCB3cml0ZVxuXG4gICAgdGhpcy5jb21wcmVzc2VkID0gZmFsc2UgLy8gSXMgdGhlIGNvbm5lY3Rpb24gY29tcHJlc3NlZCBhbmQgbmVlZHMgaW5mbGF0aW5nL2RlZmxhdGluZ1xuXG4gICAgLy9cbiAgICAvLyBIRUxQRVJTXG4gICAgLy9cblxuICAgIC8vIEFzIHRoZSBzZXJ2ZXIgc2VuZHMgZGF0YSBpbiBjaHVua3MsIGl0IG5lZWRzIHRvIGJlIHNwbGl0IGludG8gc2VwYXJhdGUgbGluZXMuIEhlbHBzIHBhcnNpbmcgdGhlIGlucHV0LlxuICAgIHRoaXMuX2luY29taW5nQnVmZmVycyA9IFtdXG4gICAgdGhpcy5fYnVmZmVyU3RhdGUgPSBCVUZGRVJfU1RBVEVfREVGQVVMVFxuICAgIHRoaXMuX2xpdGVyYWxSZW1haW5pbmcgPSAwXG5cbiAgICAvL1xuICAgIC8vIEV2ZW50IHBsYWNlaG9sZGVycywgbWF5IGJlIG92ZXJyaWRlbiB3aXRoIGNhbGxiYWNrIGZ1bmN0aW9uc1xuICAgIC8vXG4gICAgdGhpcy5vbmNlcnQgPSBudWxsXG4gICAgdGhpcy5vbmVycm9yID0gbnVsbCAvLyBJcnJlY292ZXJhYmxlIGVycm9yIG9jY3VycmVkLiBDb25uZWN0aW9uIHRvIHRoZSBzZXJ2ZXIgd2lsbCBiZSBjbG9zZWQgYXV0b21hdGljYWxseS5cbiAgICB0aGlzLm9ucmVhZHkgPSBudWxsIC8vIFRoZSBjb25uZWN0aW9uIHRvIHRoZSBzZXJ2ZXIgaGFzIGJlZW4gZXN0YWJsaXNoZWQgYW5kIGdyZWV0aW5nIGlzIHJlY2VpdmVkXG4gICAgdGhpcy5vbmlkbGUgPSBudWxsIC8vIFRoZXJlIGFyZSBubyBtb3JlIGNvbW1hbmRzIHRvIHByb2Nlc3NcbiAgfVxuXG4gIC8vIFBVQkxJQyBNRVRIT0RTXG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGEgY29ubmVjdGlvbiB0byB0aGUgc2VydmVyLiBXYWl0IGZvciBvbnJlYWR5IGV2ZW50XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBTb2NrZXRcbiAgICogICAgIFRFU1RJTkcgT05MWSEgVGhlIFRDUFNvY2tldCBoYXMgYSBwcmV0dHkgbm9uc2Vuc2ljYWwgY29udmVuaWVuY2UgY29uc3RydWN0b3IsXG4gICAqICAgICB3aGljaCBtYWtlcyBpdCBoYXJkIHRvIG1vY2suIEZvciBkZXBlbmRlbmN5LWluamVjdGlvbiBwdXJwb3Nlcywgd2UgdXNlIHRoZVxuICAgKiAgICAgU29ja2V0IHBhcmFtZXRlciB0byBwYXNzIGluIGEgbW9jayBTb2NrZXQgaW1wbGVtZW50YXRpb24uIFNob3VsZCBiZSBsZWZ0IGJsYW5rXG4gICAqICAgICBpbiBwcm9kdWN0aW9uIHVzZSFcbiAgICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVzIHdoZW4gc29ja2V0IGlzIG9wZW5lZFxuICAgKi9cbiAgY29ubmVjdCAoU29ja2V0ID0gVENQU29ja2V0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuc29ja2V0ID0gU29ja2V0Lm9wZW4odGhpcy5ob3N0LCB0aGlzLnBvcnQsIHtcbiAgICAgICAgYmluYXJ5VHlwZTogJ2FycmF5YnVmZmVyJyxcbiAgICAgICAgdXNlU2VjdXJlVHJhbnNwb3J0OiB0aGlzLnNlY3VyZU1vZGUsXG4gICAgICAgIGNhOiB0aGlzLm9wdGlvbnMuY2FcbiAgICAgIH0pXG5cbiAgICAgIC8vIGFsbG93cyBjZXJ0aWZpY2F0ZSBoYW5kbGluZyBmb3IgcGxhdGZvcm0gdy9vIG5hdGl2ZSB0bHMgc3VwcG9ydFxuICAgICAgLy8gb25jZXJ0IGlzIG5vbiBzdGFuZGFyZCBzbyBzZXR0aW5nIGl0IG1pZ2h0IHRocm93IGlmIHRoZSBzb2NrZXQgb2JqZWN0IGlzIGltbXV0YWJsZVxuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5zb2NrZXQub25jZXJ0ID0gKGNlcnQpID0+IHsgdGhpcy5vbmNlcnQgJiYgdGhpcy5vbmNlcnQoY2VydCkgfVxuICAgICAgfSBjYXRjaCAoRSkgeyB9XG5cbiAgICAgIC8vIENvbm5lY3Rpb24gY2xvc2luZyB1bmV4cGVjdGVkIGlzIGFuIGVycm9yXG4gICAgICB0aGlzLnNvY2tldC5vbmNsb3NlID0gKCkgPT4gdGhpcy5fb25FcnJvcihuZXcgRXJyb3IoJ1NvY2tldCBjbG9zZWQgdW5leHBlY3RlZGx5IScpKVxuICAgICAgdGhpcy5zb2NrZXQub25kYXRhID0gKGV2dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHRoaXMuX29uRGF0YShldnQpXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHRoaXMuX29uRXJyb3IoZXJyKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIGFuIGVycm9yIGhhcHBlbnMgZHVyaW5nIGNyZWF0ZSB0aW1lLCByZWplY3QgdGhlIHByb21pc2VcbiAgICAgIHRoaXMuc29ja2V0Lm9uZXJyb3IgPSAoZSkgPT4ge1xuICAgICAgICByZWplY3QobmV3IEVycm9yKCdDb3VsZCBub3Qgb3BlbiBzb2NrZXQ6ICcgKyBlLmRhdGEubWVzc2FnZSkpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuc29ja2V0Lm9ub3BlbiA9ICgpID0+IHtcbiAgICAgICAgLy8gdXNlIHByb3BlciBcImlycmVjb3ZlcmFibGUgZXJyb3IsIHRlYXIgZG93biBldmVyeXRoaW5nXCItaGFuZGxlciBvbmx5IGFmdGVyIHNvY2tldCBpcyBvcGVuXG4gICAgICAgIHRoaXMuc29ja2V0Lm9uZXJyb3IgPSAoZSkgPT4gdGhpcy5fb25FcnJvcihlKVxuICAgICAgICByZXNvbHZlKClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgY29ubmVjdGlvbiB0byB0aGUgc2VydmVyXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIHRoZSBzb2NrZXQgaXMgY2xvc2VkXG4gICAqL1xuICBjbG9zZSAoZXJyb3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHZhciB0ZWFyRG93biA9ICgpID0+IHtcbiAgICAgICAgLy8gZnVsZmlsbCBwZW5kaW5nIHByb21pc2VzXG4gICAgICAgIHRoaXMuX2NsaWVudFF1ZXVlLmZvckVhY2goY21kID0+IGNtZC5jYWxsYmFjayhlcnJvcikpXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50Q29tbWFuZCkge1xuICAgICAgICAgIHRoaXMuX2N1cnJlbnRDb21tYW5kLmNhbGxiYWNrKGVycm9yKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY2xpZW50UXVldWUgPSBbXVxuICAgICAgICB0aGlzLl9jdXJyZW50Q29tbWFuZCA9IGZhbHNlXG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2lkbGVUaW1lcilcbiAgICAgICAgdGhpcy5faWRsZVRpbWVyID0gbnVsbFxuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIpXG4gICAgICAgIHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lciA9IG51bGxcblxuICAgICAgICBpZiAodGhpcy5zb2NrZXQpIHtcbiAgICAgICAgICAvLyByZW1vdmUgYWxsIGxpc3RlbmVyc1xuICAgICAgICAgIHRoaXMuc29ja2V0Lm9ub3BlbiA9IG51bGxcbiAgICAgICAgICB0aGlzLnNvY2tldC5vbmNsb3NlID0gbnVsbFxuICAgICAgICAgIHRoaXMuc29ja2V0Lm9uZGF0YSA9IG51bGxcbiAgICAgICAgICB0aGlzLnNvY2tldC5vbmVycm9yID0gbnVsbFxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLnNvY2tldC5vbmNlcnQgPSBudWxsXG4gICAgICAgICAgfSBjYXRjaCAoRSkgeyB9XG5cbiAgICAgICAgICB0aGlzLnNvY2tldCA9IG51bGxcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmUoKVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9kaXNhYmxlQ29tcHJlc3Npb24oKVxuXG4gICAgICBpZiAoIXRoaXMuc29ja2V0IHx8IHRoaXMuc29ja2V0LnJlYWR5U3RhdGUgIT09ICdvcGVuJykge1xuICAgICAgICByZXR1cm4gdGVhckRvd24oKVxuICAgICAgfVxuXG4gICAgICB0aGlzLnNvY2tldC5vbmNsb3NlID0gdGhpcy5zb2NrZXQub25lcnJvciA9IHRlYXJEb3duIC8vIHdlIGRvbid0IHJlYWxseSBjYXJlIGFib3V0IHRoZSBlcnJvciBoZXJlXG4gICAgICB0aGlzLnNvY2tldC5jbG9zZSgpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIExPR09VVCB0byB0aGUgc2VydmVyLlxuICAgKlxuICAgKiBVc2UgaXMgZGlzY291cmFnZWQhXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIGNvbm5lY3Rpb24gaXMgY2xvc2VkIGJ5IHNlcnZlci5cbiAgICovXG4gIGxvZ291dCAoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuc29ja2V0Lm9uY2xvc2UgPSB0aGlzLnNvY2tldC5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCdDbGllbnQgbG9nZ2luZyBvdXQnKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdClcbiAgICAgIH1cblxuICAgICAgdGhpcy5lbnF1ZXVlQ29tbWFuZCgnTE9HT1VUJylcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlcyBUTFMgaGFuZHNoYWtlXG4gICAqL1xuICB1cGdyYWRlICgpIHtcbiAgICB0aGlzLnNlY3VyZU1vZGUgPSB0cnVlXG4gICAgdGhpcy5zb2NrZXQudXBncmFkZVRvU2VjdXJlKClcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgYSBjb21tYW5kIHRvIGJlIHNlbnQgdG8gdGhlIHNlcnZlci5cbiAgICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbWFpbGpzL2VtYWlsanMtaW1hcC1oYW5kbGVyIGZvciByZXF1ZXN0IHN0cnVjdHVyZS5cbiAgICogRG8gbm90IHByb3ZpZGUgYSB0YWcgcHJvcGVydHksIGl0IHdpbGwgYmUgc2V0IGJ5IHRoZSBxdWV1ZSBtYW5hZ2VyLlxuICAgKlxuICAgKiBUbyBjYXRjaCB1bnRhZ2dlZCByZXNwb25zZXMgdXNlIGFjY2VwdFVudGFnZ2VkIHByb3BlcnR5LiBGb3IgZXhhbXBsZSwgaWZcbiAgICogdGhlIHZhbHVlIGZvciBpdCBpcyAnRkVUQ0gnIHRoZW4gdGhlIHJlcG9uc2UgaW5jbHVkZXMgJ3BheWxvYWQuRkVUQ0gnIHByb3BlcnR5XG4gICAqIHRoYXQgaXMgYW4gYXJyYXkgaW5jbHVkaW5nIGFsbCBsaXN0ZWQgKiBGRVRDSCByZXNwb25zZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXF1ZXN0IFN0cnVjdHVyZWQgcmVxdWVzdCBvYmplY3RcbiAgICogQHBhcmFtIHtBcnJheX0gYWNjZXB0VW50YWdnZWQgYSBsaXN0IG9mIHVudGFnZ2VkIHJlc3BvbnNlcyB0aGF0IHdpbGwgYmUgaW5jbHVkZWQgaW4gJ3BheWxvYWQnIHByb3BlcnR5XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9uYWwgZGF0YSBmb3IgdGhlIGNvbW1hbmQgcGF5bG9hZFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGNvcnJlc3BvbmRpbmcgcmVzcG9uc2Ugd2FzIHJlY2VpdmVkXG4gICAqL1xuICBlbnF1ZXVlQ29tbWFuZCAocmVxdWVzdCwgYWNjZXB0VW50YWdnZWQsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIHJlcXVlc3QgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXF1ZXN0ID0ge1xuICAgICAgICBjb21tYW5kOiByZXF1ZXN0XG4gICAgICB9XG4gICAgfVxuXG4gICAgYWNjZXB0VW50YWdnZWQgPSBbXS5jb25jYXQoYWNjZXB0VW50YWdnZWQgfHwgW10pLm1hcCgodW50YWdnZWQpID0+ICh1bnRhZ2dlZCB8fCAnJykudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpLnRyaW0oKSlcblxuICAgIHZhciB0YWcgPSAnVycgKyAoKyt0aGlzLl90YWdDb3VudGVyKVxuICAgIHJlcXVlc3QudGFnID0gdGFnXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgIHRhZzogdGFnLFxuICAgICAgICByZXF1ZXN0OiByZXF1ZXN0LFxuICAgICAgICBwYXlsb2FkOiBhY2NlcHRVbnRhZ2dlZC5sZW5ndGggPyB7fSA6IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsbGJhY2s6IChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmlzRXJyb3IocmVzcG9uc2UpKSB7XG4gICAgICAgICAgICAvLyBhZGQgY29tbWFuZCBhbmQgYXR0cmlidXRlcyBmb3IgbW9yZSBjbHVlIHdoYXQgZmFpbGVkXG4gICAgICAgICAgICByZXNwb25zZS5jb21tYW5kID0gcmVxdWVzdC5jb21tYW5kXG4gICAgICAgICAgICBpZiAocmVxdWVzdC5jb21tYW5kICE9PSAnbG9naW4nKSB7XG4gICAgICAgICAgICAgIHJlc3BvbnNlLmF0dHJpYnV0ZXMgPSByZXF1ZXN0LmF0dHJpYnV0ZXNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgfSBlbHNlIGlmIChbJ05PJywgJ0JBRCddLmluZGV4T2YocHJvcE9yKCcnLCAnY29tbWFuZCcsIHJlc3BvbnNlKS50b1VwcGVyQ2FzZSgpLnRyaW0oKSkgPj0gMCkge1xuICAgICAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKHJlc3BvbnNlLmh1bWFuUmVhZGFibGUgfHwgJ0Vycm9yJylcbiAgICAgICAgICAgIC8vIGFkZCBjb21tYW5kIGFuZCBhdHRyaWJ1dGVzIGZvciBtb3JlIGNsdWUgd2hhdCBmYWlsZWRcbiAgICAgICAgICAgIGVycm9yLmNvbW1hbmQgPSByZXF1ZXN0LmNvbW1hbmRcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LmNvbW1hbmQgIT09ICdsb2dpbicpIHtcbiAgICAgICAgICAgICAgZXJyb3IuYXR0cmlidXRlcyA9IHJlcXVlc3QuYXR0cmlidXRlc1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmNvZGUpIHtcbiAgICAgICAgICAgICAgZXJyb3IuY29kZSA9IHJlc3BvbnNlLmNvZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzb2x2ZShyZXNwb25zZSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBhcHBseSBhbnkgYWRkaXRpb25hbCBvcHRpb25zIHRvIHRoZSBjb21tYW5kXG4gICAgICBPYmplY3Qua2V5cyhvcHRpb25zIHx8IHt9KS5mb3JFYWNoKChrZXkpID0+IHsgZGF0YVtrZXldID0gb3B0aW9uc1trZXldIH0pXG5cbiAgICAgIGFjY2VwdFVudGFnZ2VkLmZvckVhY2goKGNvbW1hbmQpID0+IHsgZGF0YS5wYXlsb2FkW2NvbW1hbmRdID0gW10gfSlcblxuICAgICAgLy8gaWYgd2UncmUgaW4gcHJpb3JpdHkgbW9kZSAoaS5lLiB3ZSByYW4gY29tbWFuZHMgaW4gYSBwcmVjaGVjayksXG4gICAgICAvLyBxdWV1ZSBhbnkgY29tbWFuZHMgQkVGT1JFIHRoZSBjb21tYW5kIHRoYXQgY29udGlhbmVkIHRoZSBwcmVjaGVjayxcbiAgICAgIC8vIG90aGVyd2lzZSBqdXN0IHF1ZXVlIGNvbW1hbmQgYXMgdXN1YWxcbiAgICAgIHZhciBpbmRleCA9IGRhdGEuY3R4ID8gdGhpcy5fY2xpZW50UXVldWUuaW5kZXhPZihkYXRhLmN0eCkgOiAtMVxuICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgZGF0YS50YWcgKz0gJy5wJ1xuICAgICAgICBkYXRhLnJlcXVlc3QudGFnICs9ICcucCdcbiAgICAgICAgdGhpcy5fY2xpZW50UXVldWUuc3BsaWNlKGluZGV4LCAwLCBkYXRhKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fY2xpZW50UXVldWUucHVzaChkYXRhKVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fY2FuU2VuZCkge1xuICAgICAgICB0aGlzLl9zZW5kUmVxdWVzdCgpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gY29tbWFuZHNcbiAgICogQHBhcmFtIGN0eFxuICAgKiBAcmV0dXJucyB7Kn1cbiAgICovXG4gIGdldFByZXZpb3VzbHlRdWV1ZWQgKGNvbW1hbmRzLCBjdHgpIHtcbiAgICBjb25zdCBzdGFydEluZGV4ID0gdGhpcy5fY2xpZW50UXVldWUuaW5kZXhPZihjdHgpIC0gMVxuXG4gICAgLy8gc2VhcmNoIGJhY2t3YXJkcyBmb3IgdGhlIGNvbW1hbmRzIGFuZCByZXR1cm4gdGhlIGZpcnN0IGZvdW5kXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAoaXNNYXRjaCh0aGlzLl9jbGllbnRRdWV1ZVtpXSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NsaWVudFF1ZXVlW2ldXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gYWxzbyBjaGVjayBjdXJyZW50IGNvbW1hbmQgaWYgbm8gU0VMRUNUIGlzIHF1ZXVlZFxuICAgIGlmIChpc01hdGNoKHRoaXMuX2N1cnJlbnRDb21tYW5kKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRDb21tYW5kXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgICBmdW5jdGlvbiBpc01hdGNoIChkYXRhKSB7XG4gICAgICByZXR1cm4gZGF0YSAmJiBkYXRhLnJlcXVlc3QgJiYgY29tbWFuZHMuaW5kZXhPZihkYXRhLnJlcXVlc3QuY29tbWFuZCkgPj0gMFxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGRhdGEgdG8gdGhlIFRDUCBzb2NrZXRcbiAgICogQXJtcyBhIHRpbWVvdXQgd2FpdGluZyBmb3IgYSByZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgUGF5bG9hZFxuICAgKi9cbiAgc2VuZCAoc3RyKSB7XG4gICAgY29uc3QgYnVmZmVyID0gdG9UeXBlZEFycmF5KHN0cikuYnVmZmVyXG4gICAgY29uc3QgdGltZW91dCA9IHRoaXMudGltZW91dFNvY2tldExvd2VyQm91bmQgKyBNYXRoLmZsb29yKGJ1ZmZlci5ieXRlTGVuZ3RoICogdGhpcy50aW1lb3V0U29ja2V0TXVsdGlwbGllcilcblxuICAgIGNsZWFyVGltZW91dCh0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIpIC8vIGNsZWFyIHBlbmRpbmcgdGltZW91dHNcbiAgICB0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX29uRXJyb3IobmV3IEVycm9yKCcgU29ja2V0IHRpbWVkIG91dCEnKSksIHRpbWVvdXQpIC8vIGFybSB0aGUgbmV4dCB0aW1lb3V0XG5cbiAgICBpZiAodGhpcy5jb21wcmVzc2VkKSB7XG4gICAgICB0aGlzLl9zZW5kQ29tcHJlc3NlZChidWZmZXIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghdGhpcy5zb2NrZXQpIHtcbiAgICAgICAgdGhpcy5fb25FcnJvcihuZXcgRXJyb3IoJ0Vycm9yIDo6IFVuZXhwZWN0ZWQgc29ja2V0IGNsb3NlJykpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNvY2tldC5zZW5kKGJ1ZmZlcilcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgZ2xvYmFsIGhhbmRsZXIgZm9yIGFuIHVudGFnZ2VkIHJlc3BvbnNlLiBJZiBjdXJyZW50bHkgcHJvY2Vzc2VkIGNvbW1hbmRcbiAgICogaGFzIG5vdCBsaXN0ZWQgdW50YWdnZWQgY29tbWFuZCBpdCBpcyBmb3J3YXJkZWQgdG8gdGhlIGdsb2JhbCBoYW5kbGVyLiBVc2VmdWxcbiAgICogd2l0aCBFWFBVTkdFLCBFWElTVFMgZXRjLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tbWFuZCBVbnRhZ2dlZCBjb21tYW5kIG5hbWVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gd2l0aCByZXNwb25zZSBvYmplY3QgYW5kIGNvbnRpbnVlIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqL1xuICBzZXRIYW5kbGVyIChjb21tYW5kLCBjYWxsYmFjaykge1xuICAgIHRoaXMuX2dsb2JhbEFjY2VwdFVudGFnZ2VkW2NvbW1hbmQudG9VcHBlckNhc2UoKS50cmltKCldID0gY2FsbGJhY2tcbiAgfVxuXG4gIC8vIElOVEVSTkFMIEVWRU5UU1xuXG4gIC8qKlxuICAgKiBFcnJvciBoYW5kbGVyIGZvciB0aGUgc29ja2V0XG4gICAqXG4gICAqIEBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50fSBldnQgRXZlbnQgb2JqZWN0LiBTZWUgZXZ0LmRhdGEgZm9yIHRoZSBlcnJvclxuICAgKi9cbiAgX29uRXJyb3IgKGV2dCkge1xuICAgIHZhciBlcnJvclxuICAgIGlmICh0aGlzLmlzRXJyb3IoZXZ0KSkge1xuICAgICAgZXJyb3IgPSBldnRcbiAgICB9IGVsc2UgaWYgKGV2dCAmJiB0aGlzLmlzRXJyb3IoZXZ0LmRhdGEpKSB7XG4gICAgICBlcnJvciA9IGV2dC5kYXRhXG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKChldnQgJiYgZXZ0LmRhdGEgJiYgZXZ0LmRhdGEubWVzc2FnZSkgfHwgZXZ0LmRhdGEgfHwgZXZ0IHx8ICdFcnJvcicpXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZXJyb3IoZXJyb3IpXG5cbiAgICAvLyBhbHdheXMgY2FsbCBvbmVycm9yIGNhbGxiYWNrLCBubyBtYXR0ZXIgaWYgY2xvc2UoKSBzdWNjZWVkcyBvciBmYWlsc1xuICAgIHRoaXMuY2xvc2UoZXJyb3IpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5vbmVycm9yICYmIHRoaXMub25lcnJvcihlcnJvcilcbiAgICB9LCAoKSA9PiB7XG4gICAgICB0aGlzLm9uZXJyb3IgJiYgdGhpcy5vbmVycm9yKGVycm9yKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlciBmb3IgaW5jb21pbmcgZGF0YSBmcm9tIHRoZSBzZXJ2ZXIuIFRoZSBkYXRhIGlzIHNlbnQgaW4gYXJiaXRyYXJ5XG4gICAqIGNodW5rcyBhbmQgY2FuJ3QgYmUgdXNlZCBkaXJlY3RseSBzbyB0aGlzIGZ1bmN0aW9uIG1ha2VzIHN1cmUgdGhlIGRhdGFcbiAgICogaXMgc3BsaXQgaW50byBjb21wbGV0ZSBsaW5lcyBiZWZvcmUgdGhlIGRhdGEgaXMgcGFzc2VkIHRvIHRoZSBjb21tYW5kXG4gICAqIGhhbmRsZXJcbiAgICpcbiAgICogQHBhcmFtIHtFdmVudH0gZXZ0XG4gICAqL1xuICBfb25EYXRhIChldnQpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fc29ja2V0VGltZW91dFRpbWVyKSAvLyByZXNldCB0aGUgdGltZW91dCBvbiBlYWNoIGRhdGEgcGFja2V0XG4gICAgY29uc3QgdGltZW91dCA9IHRoaXMudGltZW91dFNvY2tldExvd2VyQm91bmQgKyBNYXRoLmZsb29yKDQwOTYgKiB0aGlzLnRpbWVvdXRTb2NrZXRNdWx0aXBsaWVyKSAvLyBtYXggcGFja2V0IHNpemUgaXMgNDA5NiBieXRlc1xuICAgIHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fb25FcnJvcihuZXcgRXJyb3IoJyBTb2NrZXQgdGltZWQgb3V0IScpKSwgdGltZW91dClcblxuICAgIHRoaXMuX2luY29taW5nQnVmZmVycy5wdXNoKG5ldyBVaW50OEFycmF5KGV2dC5kYXRhKSkgLy8gYXBwZW5kIHRvIHRoZSBpbmNvbWluZyBidWZmZXJcbiAgICB0aGlzLl9wYXJzZUluY29taW5nQ29tbWFuZHModGhpcy5faXRlcmF0ZUluY29taW5nQnVmZmVyKCkpIC8vIENvbnN1bWUgdGhlIGluY29taW5nIGJ1ZmZlclxuICB9XG5cbiAgKiBfaXRlcmF0ZUluY29taW5nQnVmZmVyICgpIHtcbiAgICBsZXQgYnVmID0gdGhpcy5faW5jb21pbmdCdWZmZXJzW3RoaXMuX2luY29taW5nQnVmZmVycy5sZW5ndGggLSAxXSB8fCBbXVxuICAgIGxldCBpID0gMFxuXG4gICAgLy8gbG9vcCBpbnZhcmlhbnQ6XG4gICAgLy8gICB0aGlzLl9pbmNvbWluZ0J1ZmZlcnMgc3RhcnRzIHdpdGggdGhlIGJlZ2lubmluZyBvZiBpbmNvbWluZyBjb21tYW5kLlxuICAgIC8vICAgYnVmIGlzIHNob3J0aGFuZCBmb3IgbGFzdCBlbGVtZW50IG9mIHRoaXMuX2luY29taW5nQnVmZmVycy5cbiAgICAvLyAgIGJ1ZlswLi5pLTFdIGlzIHBhcnQgb2YgaW5jb21pbmcgY29tbWFuZC5cbiAgICB3aGlsZSAoaSA8IGJ1Zi5sZW5ndGgpIHtcbiAgICAgIHN3aXRjaCAodGhpcy5fYnVmZmVyU3RhdGUpIHtcbiAgICAgICAgY2FzZSBCVUZGRVJfU1RBVEVfTElURVJBTDpcbiAgICAgICAgICBjb25zdCBkaWZmID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIGksIHRoaXMuX2xpdGVyYWxSZW1haW5pbmcpXG4gICAgICAgICAgdGhpcy5fbGl0ZXJhbFJlbWFpbmluZyAtPSBkaWZmXG4gICAgICAgICAgaSArPSBkaWZmXG4gICAgICAgICAgaWYgKHRoaXMuX2xpdGVyYWxSZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2J1ZmZlclN0YXRlID0gQlVGRkVSX1NUQVRFX0RFRkFVTFRcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWVcblxuICAgICAgICBjYXNlIEJVRkZFUl9TVEFURV9QT1NTSUJMWV9MSVRFUkFMX0xFTkdUSF8yOlxuICAgICAgICAgIGlmIChpIDwgYnVmLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGJ1ZltpXSA9PT0gQ0FSUklBR0VfUkVUVVJOKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2xpdGVyYWxSZW1haW5pbmcgPSBOdW1iZXIoZnJvbVR5cGVkQXJyYXkodGhpcy5fbGVuZ3RoQnVmZmVyKSkgKyAyIC8vIGZvciBDUkxGXG4gICAgICAgICAgICAgIHRoaXMuX2J1ZmZlclN0YXRlID0gQlVGRkVSX1NUQVRFX0xJVEVSQUxcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuX2J1ZmZlclN0YXRlID0gQlVGRkVSX1NUQVRFX0RFRkFVTFRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9sZW5ndGhCdWZmZXJcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWVcblxuICAgICAgICBjYXNlIEJVRkZFUl9TVEFURV9QT1NTSUJMWV9MSVRFUkFMX0xFTkdUSF8xOlxuICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gaVxuICAgICAgICAgIHdoaWxlIChpIDwgYnVmLmxlbmd0aCAmJiBidWZbaV0gPj0gNDggJiYgYnVmW2ldIDw9IDU3KSB7IC8vIGRpZ2l0c1xuICAgICAgICAgICAgaSsrXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdGFydCAhPT0gaSkge1xuICAgICAgICAgICAgY29uc3QgbGF0ZXN0ID0gYnVmLnN1YmFycmF5KHN0YXJ0LCBpKVxuICAgICAgICAgICAgY29uc3QgcHJldkJ1ZiA9IHRoaXMuX2xlbmd0aEJ1ZmZlclxuICAgICAgICAgICAgdGhpcy5fbGVuZ3RoQnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkocHJldkJ1Zi5sZW5ndGggKyBsYXRlc3QubGVuZ3RoKVxuICAgICAgICAgICAgdGhpcy5fbGVuZ3RoQnVmZmVyLnNldChwcmV2QnVmKVxuICAgICAgICAgICAgdGhpcy5fbGVuZ3RoQnVmZmVyLnNldChsYXRlc3QsIHByZXZCdWYubGVuZ3RoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaSA8IGJ1Zi5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9sZW5ndGhCdWZmZXIubGVuZ3RoID4gMCAmJiBidWZbaV0gPT09IFJJR0hUX0NVUkxZX0JSQUNLRVQpIHtcbiAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyU3RhdGUgPSBCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMlxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2xlbmd0aEJ1ZmZlclxuICAgICAgICAgICAgICB0aGlzLl9idWZmZXJTdGF0ZSA9IEJVRkZFUl9TVEFURV9ERUZBVUxUXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKytcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWVcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIC8vIGZpbmQgbGl0ZXJhbCBsZW5ndGhcbiAgICAgICAgICBjb25zdCBsZWZ0SWR4ID0gYnVmLmluZGV4T2YoTEVGVF9DVVJMWV9CUkFDS0VULCBpKVxuICAgICAgICAgIGlmIChsZWZ0SWR4ID4gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IGxlZnRPZkxlZnRDdXJseSA9IG5ldyBVaW50OEFycmF5KGJ1Zi5idWZmZXIsIGksIGxlZnRJZHggLSBpKVxuICAgICAgICAgICAgaWYgKGxlZnRPZkxlZnRDdXJseS5pbmRleE9mKExJTkVfRkVFRCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgIGkgPSBsZWZ0SWR4ICsgMVxuICAgICAgICAgICAgICB0aGlzLl9sZW5ndGhCdWZmZXIgPSBuZXcgVWludDhBcnJheSgwKVxuICAgICAgICAgICAgICB0aGlzLl9idWZmZXJTdGF0ZSA9IEJVRkZFUl9TVEFURV9QT1NTSUJMWV9MSVRFUkFMX0xFTkdUSF8xXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gZmluZCBlbmQgb2YgY29tbWFuZFxuICAgICAgICAgIGNvbnN0IExGaWR4ID0gYnVmLmluZGV4T2YoTElORV9GRUVELCBpKVxuICAgICAgICAgIGlmIChMRmlkeCA+IC0xKSB7XG4gICAgICAgICAgICBpZiAoTEZpZHggPCBidWYubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICB0aGlzLl9pbmNvbWluZ0J1ZmZlcnNbdGhpcy5faW5jb21pbmdCdWZmZXJzLmxlbmd0aCAtIDFdID0gbmV3IFVpbnQ4QXJyYXkoYnVmLmJ1ZmZlciwgMCwgTEZpZHggKyAxKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29tbWFuZExlbmd0aCA9IHRoaXMuX2luY29taW5nQnVmZmVycy5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IHByZXYgKyBjdXJyLmxlbmd0aCwgMCkgLSAyIC8vIDIgZm9yIENSTEZcbiAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgVWludDhBcnJheShjb21tYW5kTGVuZ3RoKVxuICAgICAgICAgICAgbGV0IGluZGV4ID0gMFxuICAgICAgICAgICAgd2hpbGUgKHRoaXMuX2luY29taW5nQnVmZmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIGxldCB1aW50OEFycmF5ID0gdGhpcy5faW5jb21pbmdCdWZmZXJzLnNoaWZ0KClcblxuICAgICAgICAgICAgICBjb25zdCByZW1haW5pbmdMZW5ndGggPSBjb21tYW5kTGVuZ3RoIC0gaW5kZXhcbiAgICAgICAgICAgICAgaWYgKHVpbnQ4QXJyYXkubGVuZ3RoID4gcmVtYWluaW5nTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhjZXNzTGVuZ3RoID0gdWludDhBcnJheS5sZW5ndGggLSByZW1haW5pbmdMZW5ndGhcbiAgICAgICAgICAgICAgICB1aW50OEFycmF5ID0gdWludDhBcnJheS5zdWJhcnJheSgwLCAtZXhjZXNzTGVuZ3RoKVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2luY29taW5nQnVmZmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLl9pbmNvbWluZ0J1ZmZlcnMgPSBbXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb21tYW5kLnNldCh1aW50OEFycmF5LCBpbmRleClcbiAgICAgICAgICAgICAgaW5kZXggKz0gdWludDhBcnJheS5sZW5ndGhcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHlpZWxkIGNvbW1hbmRcbiAgICAgICAgICAgIGlmIChMRmlkeCA8IGJ1Zi5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGJ1Zi5zdWJhcnJheShMRmlkeCArIDEpKVxuICAgICAgICAgICAgICB0aGlzLl9pbmNvbWluZ0J1ZmZlcnMucHVzaChidWYpXG4gICAgICAgICAgICAgIGkgPSAwXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBjbGVhciB0aGUgdGltZW91dCB3aGVuIGFuIGVudGlyZSBjb21tYW5kIGhhcyBhcnJpdmVkXG4gICAgICAgICAgICAgIC8vIGFuZCBub3Qgd2FpdGluZyBvbiBtb3JlIGRhdGEgZm9yIG5leHQgY29tbWFuZFxuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fc29ja2V0VGltZW91dFRpbWVyKVxuICAgICAgICAgICAgICB0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIgPSBudWxsXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gUFJJVkFURSBNRVRIT0RTXG5cbiAgLyoqXG4gICAqIFByb2Nlc3NlcyBhIGNvbW1hbmQgZnJvbSB0aGUgcXVldWUuIFRoZSBjb21tYW5kIGlzIHBhcnNlZCBhbmQgZmVlZGVkIHRvIGEgaGFuZGxlclxuICAgKi9cbiAgX3BhcnNlSW5jb21pbmdDb21tYW5kcyAoY29tbWFuZHMpIHtcbiAgICBmb3IgKHZhciBjb21tYW5kIG9mIGNvbW1hbmRzKSB7XG4gICAgICB0aGlzLl9jbGVhcklkbGUoKVxuXG4gICAgICAvKlxuICAgICAgICogVGhlIFwiK1wiLXRhZ2dlZCByZXNwb25zZSBpcyBhIHNwZWNpYWwgY2FzZTpcbiAgICAgICAqIEVpdGhlciB0aGUgc2VydmVyIGNhbiBhc2tzIGZvciB0aGUgbmV4dCBjaHVuayBvZiBkYXRhLCBlLmcuIGZvciB0aGUgQVVUSEVOVElDQVRFIGNvbW1hbmQuXG4gICAgICAgKlxuICAgICAgICogT3IgdGhlcmUgd2FzIGFuIGVycm9yIGluIHRoZSBYT0FVVEgyIGF1dGhlbnRpY2F0aW9uLCBmb3Igd2hpY2ggU0FTTCBpbml0aWFsIGNsaWVudCByZXNwb25zZSBleHRlbnNpb25cbiAgICAgICAqIGRpY3RhdGVzIHRoZSBjbGllbnQgc2VuZHMgYW4gZW1wdHkgRU9MIHJlc3BvbnNlIHRvIHRoZSBjaGFsbGVuZ2UgY29udGFpbmluZyB0aGUgZXJyb3IgbWVzc2FnZS5cbiAgICAgICAqXG4gICAgICAgKiBEZXRhaWxzIG9uIFwiK1wiLXRhZ2dlZCByZXNwb25zZTpcbiAgICAgICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi0yLjIuMVxuICAgICAgICovXG4gICAgICAvL1xuICAgICAgaWYgKGNvbW1hbmRbMF0gPT09IEFTQ0lJX1BMVVMpIHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRDb21tYW5kLmRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgLy8gZmVlZCB0aGUgbmV4dCBjaHVuayBvZiBkYXRhXG4gICAgICAgICAgdmFyIGNodW5rID0gdGhpcy5fY3VycmVudENvbW1hbmQuZGF0YS5zaGlmdCgpXG4gICAgICAgICAgY2h1bmsgKz0gKCF0aGlzLl9jdXJyZW50Q29tbWFuZC5kYXRhLmxlbmd0aCA/IEVPTCA6ICcnKSAvLyBFT0wgaWYgdGhlcmUncyBub3RoaW5nIG1vcmUgdG8gc2VuZFxuICAgICAgICAgIHRoaXMuc2VuZChjaHVuaylcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9jdXJyZW50Q29tbWFuZC5lcnJvclJlc3BvbnNlRXhwZWN0c0VtcHR5TGluZSkge1xuICAgICAgICAgIHRoaXMuc2VuZChFT0wpIC8vIFhPQVVUSDIgZW1wdHkgcmVzcG9uc2UsIGVycm9yIHdpbGwgYmUgcmVwb3J0ZWQgd2hlbiBzZXJ2ZXIgY29udGludWVzIHdpdGggTk8gcmVzcG9uc2VcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgcmVzcG9uc2VcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHZhbHVlQXNTdHJpbmcgPSB0aGlzLl9jdXJyZW50Q29tbWFuZC5yZXF1ZXN0ICYmIHRoaXMuX2N1cnJlbnRDb21tYW5kLnJlcXVlc3QudmFsdWVBc1N0cmluZ1xuICAgICAgICByZXNwb25zZSA9IHBhcnNlcihjb21tYW5kLCB7IHZhbHVlQXNTdHJpbmcgfSlcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ1M6JywgKCkgPT4gY29tcGlsZXIocmVzcG9uc2UsIGZhbHNlLCB0cnVlKSlcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIHBhcnNpbmcgaW1hcCBjb21tYW5kIScsIEpTT04uc3RyaW5naWZ5KHsgcmVzcG9uc2UsIGNvbW1hbmQgfSkpXG4gICAgICAgIHJldHVybiB0aGlzLl9vbkVycm9yKGUpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3Byb2Nlc3NSZXNwb25zZShyZXNwb25zZSlcbiAgICAgIHRoaXMuX2hhbmRsZVJlc3BvbnNlKHJlc3BvbnNlKVxuXG4gICAgICAvLyBmaXJzdCByZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXIsIGNvbm5lY3Rpb24gaXMgbm93IHVzYWJsZVxuICAgICAgaWYgKCF0aGlzLl9jb25uZWN0aW9uUmVhZHkpIHtcbiAgICAgICAgdGhpcy5fY29ubmVjdGlvblJlYWR5ID0gdHJ1ZVxuICAgICAgICB0aGlzLm9ucmVhZHkgJiYgdGhpcy5vbnJlYWR5KClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRmVlZHMgYSBwYXJzZWQgcmVzcG9uc2Ugb2JqZWN0IHRvIGFuIGFwcHJvcHJpYXRlIGhhbmRsZXJcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIFBhcnNlZCBjb21tYW5kIG9iamVjdFxuICAgKi9cbiAgX2hhbmRsZVJlc3BvbnNlIChyZXNwb25zZSkge1xuICAgIHZhciBjb21tYW5kID0gcHJvcE9yKCcnLCAnY29tbWFuZCcsIHJlc3BvbnNlKS50b1VwcGVyQ2FzZSgpLnRyaW0oKVxuXG4gICAgaWYgKCF0aGlzLl9jdXJyZW50Q29tbWFuZCkge1xuICAgICAgLy8gdW5zb2xpY2l0ZWQgdW50YWdnZWQgcmVzcG9uc2VcbiAgICAgIGlmIChyZXNwb25zZS50YWcgPT09ICcqJyAmJiBjb21tYW5kIGluIHRoaXMuX2dsb2JhbEFjY2VwdFVudGFnZ2VkKSB7XG4gICAgICAgIHRoaXMuX2dsb2JhbEFjY2VwdFVudGFnZ2VkW2NvbW1hbmRdKHJlc3BvbnNlKVxuICAgICAgICB0aGlzLl9jYW5TZW5kID0gdHJ1ZVxuICAgICAgICB0aGlzLl9zZW5kUmVxdWVzdCgpXG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLl9jdXJyZW50Q29tbWFuZC5wYXlsb2FkICYmIHJlc3BvbnNlLnRhZyA9PT0gJyonICYmIGNvbW1hbmQgaW4gdGhpcy5fY3VycmVudENvbW1hbmQucGF5bG9hZCkge1xuICAgICAgLy8gZXhwZWN0ZWQgdW50YWdnZWQgcmVzcG9uc2VcbiAgICAgIHRoaXMuX2N1cnJlbnRDb21tYW5kLnBheWxvYWRbY29tbWFuZF0ucHVzaChyZXNwb25zZSlcbiAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnRhZyA9PT0gJyonICYmIGNvbW1hbmQgaW4gdGhpcy5fZ2xvYmFsQWNjZXB0VW50YWdnZWQpIHtcbiAgICAgIC8vIHVuZXhwZWN0ZWQgdW50YWdnZWQgcmVzcG9uc2VcbiAgICAgIHRoaXMuX2dsb2JhbEFjY2VwdFVudGFnZ2VkW2NvbW1hbmRdKHJlc3BvbnNlKVxuICAgIH0gZWxzZSBpZiAocmVzcG9uc2UudGFnID09PSB0aGlzLl9jdXJyZW50Q29tbWFuZC50YWcpIHtcbiAgICAgIC8vIHRhZ2dlZCByZXNwb25zZVxuICAgICAgaWYgKHRoaXMuX2N1cnJlbnRDb21tYW5kLnBheWxvYWQgJiYgT2JqZWN0LmtleXModGhpcy5fY3VycmVudENvbW1hbmQucGF5bG9hZCkubGVuZ3RoKSB7XG4gICAgICAgIHJlc3BvbnNlLnBheWxvYWQgPSB0aGlzLl9jdXJyZW50Q29tbWFuZC5wYXlsb2FkXG4gICAgICB9XG4gICAgICB0aGlzLl9jdXJyZW50Q29tbWFuZC5jYWxsYmFjayhyZXNwb25zZSlcbiAgICAgIHRoaXMuX2NhblNlbmQgPSB0cnVlXG4gICAgICB0aGlzLl9zZW5kUmVxdWVzdCgpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmRzIGEgY29tbWFuZCBmcm9tIGNsaWVudCBxdWV1ZSB0byB0aGUgc2VydmVyLlxuICAgKi9cbiAgX3NlbmRSZXF1ZXN0ICgpIHtcbiAgICBpZiAoIXRoaXMuX2NsaWVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2VudGVySWRsZSgpXG4gICAgfVxuICAgIHRoaXMuX2NsZWFySWRsZSgpXG5cbiAgICAvLyBhbiBvcGVyYXRpb24gd2FzIG1hZGUgaW4gdGhlIHByZWNoZWNrLCBubyBuZWVkIHRvIHJlc3RhcnQgdGhlIHF1ZXVlIG1hbnVhbGx5XG4gICAgdGhpcy5fcmVzdGFydFF1ZXVlID0gZmFsc2VcblxuICAgIHZhciBjb21tYW5kID0gdGhpcy5fY2xpZW50UXVldWVbMF1cbiAgICBpZiAodHlwZW9mIGNvbW1hbmQucHJlY2hlY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIHJlbWVtYmVyIHRoZSBjb250ZXh0XG4gICAgICB2YXIgY29udGV4dCA9IGNvbW1hbmRcbiAgICAgIHZhciBwcmVjaGVjayA9IGNvbnRleHQucHJlY2hlY2tcbiAgICAgIGRlbGV0ZSBjb250ZXh0LnByZWNoZWNrXG5cbiAgICAgIC8vIHdlIG5lZWQgdG8gcmVzdGFydCB0aGUgcXVldWUgaGFuZGxpbmcgaWYgbm8gb3BlcmF0aW9uIHdhcyBtYWRlIGluIHRoZSBwcmVjaGVja1xuICAgICAgdGhpcy5fcmVzdGFydFF1ZXVlID0gdHJ1ZVxuXG4gICAgICAvLyBpbnZva2UgdGhlIHByZWNoZWNrIGNvbW1hbmQgYW5kIHJlc3VtZSBub3JtYWwgb3BlcmF0aW9uIGFmdGVyIHRoZSBwcm9taXNlIHJlc29sdmVzXG4gICAgICBwcmVjaGVjayhjb250ZXh0KS50aGVuKCgpID0+IHtcbiAgICAgICAgLy8gd2UncmUgZG9uZSB3aXRoIHRoZSBwcmVjaGVja1xuICAgICAgICBpZiAodGhpcy5fcmVzdGFydFF1ZXVlKSB7XG4gICAgICAgICAgLy8gd2UgbmVlZCB0byByZXN0YXJ0IHRoZSBxdWV1ZSBoYW5kbGluZ1xuICAgICAgICAgIHRoaXMuX3NlbmRSZXF1ZXN0KClcbiAgICAgICAgfVxuICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAvLyBwcmVjaGVjayBmYWlsZWQsIHNvIHdlIHJlbW92ZSB0aGUgaW5pdGlhbCBjb21tYW5kXG4gICAgICAgIC8vIGZyb20gdGhlIHF1ZXVlLCBpbnZva2UgaXRzIGNhbGxiYWNrIGFuZCByZXN1bWUgbm9ybWFsIG9wZXJhdGlvblxuICAgICAgICBsZXQgY21kXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fY2xpZW50UXVldWUuaW5kZXhPZihjb250ZXh0KVxuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIGNtZCA9IHRoaXMuX2NsaWVudFF1ZXVlLnNwbGljZShpbmRleCwgMSlbMF1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY21kICYmIGNtZC5jYWxsYmFjaykge1xuICAgICAgICAgIGNtZC5jYWxsYmFjayhlcnIpXG4gICAgICAgICAgdGhpcy5fY2FuU2VuZCA9IHRydWVcbiAgICAgICAgICB0aGlzLl9wYXJzZUluY29taW5nQ29tbWFuZHModGhpcy5faXRlcmF0ZUluY29taW5nQnVmZmVyKCkpIC8vIENvbnN1bWUgdGhlIHJlc3Qgb2YgdGhlIGluY29taW5nIGJ1ZmZlclxuICAgICAgICAgIHRoaXMuX3NlbmRSZXF1ZXN0KCkgLy8gY29udGludWUgc2VuZGluZ1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5fY2FuU2VuZCA9IGZhbHNlXG4gICAgdGhpcy5fY3VycmVudENvbW1hbmQgPSB0aGlzLl9jbGllbnRRdWV1ZS5zaGlmdCgpXG5cbiAgICB0cnkge1xuICAgICAgdGhpcy5fY3VycmVudENvbW1hbmQuZGF0YSA9IGNvbXBpbGVyKHRoaXMuX2N1cnJlbnRDb21tYW5kLnJlcXVlc3QsIHRydWUpXG4gICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnQzonLCAoKSA9PiBjb21waWxlcih0aGlzLl9jdXJyZW50Q29tbWFuZC5yZXF1ZXN0LCBmYWxzZSwgdHJ1ZSkpIC8vIGV4Y2x1ZGVzIHBhc3N3b3JkcyBldGMuXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIGNvbXBpbGluZyBpbWFwIGNvbW1hbmQhJywgdGhpcy5fY3VycmVudENvbW1hbmQucmVxdWVzdClcbiAgICAgIHJldHVybiB0aGlzLl9vbkVycm9yKG5ldyBFcnJvcignRXJyb3IgY29tcGlsaW5nIGltYXAgY29tbWFuZCEnKSlcbiAgICB9XG5cbiAgICB2YXIgZGF0YSA9IHRoaXMuX2N1cnJlbnRDb21tYW5kLmRhdGEuc2hpZnQoKVxuXG4gICAgdGhpcy5zZW5kKGRhdGEgKyAoIXRoaXMuX2N1cnJlbnRDb21tYW5kLmRhdGEubGVuZ3RoID8gRU9MIDogJycpKVxuICAgIHJldHVybiB0aGlzLndhaXREcmFpblxuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIG9uaWRsZSwgbm90aW5nIHRvIGRvIGN1cnJlbnRseVxuICAgKi9cbiAgX2VudGVySWRsZSAoKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2lkbGVUaW1lcilcbiAgICB0aGlzLl9pZGxlVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+ICh0aGlzLm9uaWRsZSAmJiB0aGlzLm9uaWRsZSgpKSwgdGhpcy50aW1lb3V0RW50ZXJJZGxlKVxuICB9XG5cbiAgLyoqXG4gICAqIENhbmNlbCBpZGxlIHRpbWVyXG4gICAqL1xuICBfY2xlYXJJZGxlICgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5faWRsZVRpbWVyKVxuICAgIHRoaXMuX2lkbGVUaW1lciA9IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBNZXRob2QgcHJvY2Vzc2VzIGEgcmVzcG9uc2UgaW50byBhbiBlYXNpZXIgdG8gaGFuZGxlIGZvcm1hdC5cbiAgICogQWRkIHVudGFnZ2VkIG51bWJlcmVkIHJlc3BvbnNlcyAoZS5nLiBGRVRDSCkgaW50byBhIG5pY2VseSBmZWFzaWJsZSBmb3JtXG4gICAqIENoZWNrcyBpZiBhIHJlc3BvbnNlIGluY2x1ZGVzIG9wdGlvbmFsIHJlc3BvbnNlIGNvZGVzXG4gICAqIGFuZCBjb3BpZXMgdGhlc2UgaW50byBzZXBhcmF0ZSBwcm9wZXJ0aWVzLiBGb3IgZXhhbXBsZSB0aGVcbiAgICogZm9sbG93aW5nIHJlc3BvbnNlIGluY2x1ZGVzIGEgY2FwYWJpbGl0eSBsaXN0aW5nIGFuZCBhIGh1bWFuXG4gICAqIHJlYWRhYmxlIG1lc3NhZ2U6XG4gICAqXG4gICAqICAgICAqIE9LIFtDQVBBQklMSVRZIElEIE5BTUVTUEFDRV0gQWxsIHJlYWR5XG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGFkZHMgYSAnY2FwYWJpbGl0eScgcHJvcGVydHkgd2l0aCBhbiBhcnJheSB2YWx1ZSBbJ0lEJywgJ05BTUVTUEFDRSddXG4gICAqIHRvIHRoZSByZXNwb25zZSBvYmplY3QuIEFkZGl0aW9uYWxseSAnQWxsIHJlYWR5JyBpcyBhZGRlZCBhcyAnaHVtYW5SZWFkYWJsZScgcHJvcGVydHkuXG4gICAqXG4gICAqIFNlZSBwb3NzaWJsZW0gSU1BUCBSZXNwb25zZSBDb2RlcyBhdCBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNTUzMFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgUGFyc2VkIHJlc3BvbnNlIG9iamVjdFxuICAgKi9cbiAgX3Byb2Nlc3NSZXNwb25zZSAocmVzcG9uc2UpIHtcbiAgICBjb25zdCBjb21tYW5kID0gcHJvcE9yKCcnLCAnY29tbWFuZCcsIHJlc3BvbnNlKS50b1VwcGVyQ2FzZSgpLnRyaW0oKVxuXG4gICAgLy8gbm8gYXR0cmlidXRlc1xuICAgIGlmICghcmVzcG9uc2UgfHwgIXJlc3BvbnNlLmF0dHJpYnV0ZXMgfHwgIXJlc3BvbnNlLmF0dHJpYnV0ZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyB1bnRhZ2dlZCByZXNwb25zZXMgdy8gc2VxdWVuY2UgbnVtYmVyc1xuICAgIGlmIChyZXNwb25zZS50YWcgPT09ICcqJyAmJiAvXlxcZCskLy50ZXN0KHJlc3BvbnNlLmNvbW1hbmQpICYmIHJlc3BvbnNlLmF0dHJpYnV0ZXNbMF0udHlwZSA9PT0gJ0FUT00nKSB7XG4gICAgICByZXNwb25zZS5uciA9IE51bWJlcihyZXNwb25zZS5jb21tYW5kKVxuICAgICAgcmVzcG9uc2UuY29tbWFuZCA9IChyZXNwb25zZS5hdHRyaWJ1dGVzLnNoaWZ0KCkudmFsdWUgfHwgJycpLnRvU3RyaW5nKCkudG9VcHBlckNhc2UoKS50cmltKClcbiAgICB9XG5cbiAgICAvLyBubyBvcHRpb25hbCByZXNwb25zZSBjb2RlXG4gICAgaWYgKFsnT0snLCAnTk8nLCAnQkFEJywgJ0JZRScsICdQUkVBVVRIJ10uaW5kZXhPZihjb21tYW5kKSA8IDApIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIElmIGxhc3QgZWxlbWVudCBvZiB0aGUgcmVzcG9uc2UgaXMgVEVYVCB0aGVuIHRoaXMgaXMgZm9yIGh1bWFuc1xuICAgIGlmIChyZXNwb25zZS5hdHRyaWJ1dGVzW3Jlc3BvbnNlLmF0dHJpYnV0ZXMubGVuZ3RoIC0gMV0udHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICByZXNwb25zZS5odW1hblJlYWRhYmxlID0gcmVzcG9uc2UuYXR0cmlidXRlc1tyZXNwb25zZS5hdHRyaWJ1dGVzLmxlbmd0aCAtIDFdLnZhbHVlXG4gICAgfVxuXG4gICAgLy8gUGFyc2UgYW5kIGZvcm1hdCBBVE9NIHZhbHVlc1xuICAgIGlmIChyZXNwb25zZS5hdHRyaWJ1dGVzWzBdLnR5cGUgPT09ICdBVE9NJyAmJiByZXNwb25zZS5hdHRyaWJ1dGVzWzBdLnNlY3Rpb24pIHtcbiAgICAgIGNvbnN0IG9wdGlvbiA9IHJlc3BvbnNlLmF0dHJpYnV0ZXNbMF0uc2VjdGlvbi5tYXAoKGtleSkgPT4ge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgICAgICByZXR1cm4ga2V5Lm1hcCgoa2V5KSA9PiAoa2V5LnZhbHVlIHx8ICcnKS50b1N0cmluZygpLnRyaW0oKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gKGtleS52YWx1ZSB8fCAnJykudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpLnRyaW0oKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBjb25zdCBrZXkgPSBvcHRpb24uc2hpZnQoKVxuICAgICAgcmVzcG9uc2UuY29kZSA9IGtleVxuXG4gICAgICBpZiAob3B0aW9uLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXNwb25zZVtrZXkudG9Mb3dlckNhc2UoKV0gPSBvcHRpb25bMF1cbiAgICAgIH0gZWxzZSBpZiAob3B0aW9uLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgcmVzcG9uc2Vba2V5LnRvTG93ZXJDYXNlKCldID0gb3B0aW9uXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIHZhbHVlIGlzIGFuIEVycm9yIG9iamVjdFxuICAgKlxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZSBWYWx1ZSB0byBiZSBjaGVja2VkXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59IHJldHVybnMgdHJ1ZSBpZiB0aGUgdmFsdWUgaXMgYW4gRXJyb3JcbiAgICovXG4gIGlzRXJyb3IgKHZhbHVlKSB7XG4gICAgcmV0dXJuICEhT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKS5tYXRjaCgvRXJyb3JcXF0kLylcbiAgfVxuXG4gIC8vIENPTVBSRVNTSU9OIFJFTEFURUQgTUVUSE9EU1xuXG4gIC8qKlxuICAgKiBTZXRzIHVwIGRlZmxhdGUvaW5mbGF0ZSBmb3IgdGhlIElPXG4gICAqL1xuICBlbmFibGVDb21wcmVzc2lvbiAoKSB7XG4gICAgdGhpcy5fc29ja2V0T25EYXRhID0gdGhpcy5zb2NrZXQub25kYXRhXG4gICAgdGhpcy5jb21wcmVzc2VkID0gdHJ1ZVxuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5Xb3JrZXIpIHtcbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uV29ya2VyID0gbmV3IFdvcmtlcihVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtDb21wcmVzc2lvbkJsb2JdKSkpXG4gICAgICB0aGlzLl9jb21wcmVzc2lvbldvcmtlci5vbm1lc3NhZ2UgPSAoZSkgPT4ge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IGUuZGF0YS5tZXNzYWdlXG4gICAgICAgIHZhciBkYXRhID0gZS5kYXRhLmJ1ZmZlclxuXG4gICAgICAgIHN3aXRjaCAobWVzc2FnZSkge1xuICAgICAgICAgIGNhc2UgTUVTU0FHRV9JTkZMQVRFRF9EQVRBX1JFQURZOlxuICAgICAgICAgICAgdGhpcy5fc29ja2V0T25EYXRhKHsgZGF0YSB9KVxuICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9ERUZMQVRFRF9EQVRBX1JFQURZOlxuICAgICAgICAgICAgdGhpcy53YWl0RHJhaW4gPSB0aGlzLnNvY2tldC5zZW5kKGRhdGEpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uV29ya2VyLm9uZXJyb3IgPSAoZSkgPT4ge1xuICAgICAgICB0aGlzLl9vbkVycm9yKG5ldyBFcnJvcignRXJyb3IgaGFuZGxpbmcgY29tcHJlc3Npb24gd2ViIHdvcmtlcjogJyArIGUubWVzc2FnZSkpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uV29ya2VyLnBvc3RNZXNzYWdlKGNyZWF0ZU1lc3NhZ2UoTUVTU0FHRV9JTklUSUFMSVpFX1dPUktFUikpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGluZmxhdGVkUmVhZHkgPSAoYnVmZmVyKSA9PiB7IHRoaXMuX3NvY2tldE9uRGF0YSh7IGRhdGE6IGJ1ZmZlciB9KSB9XG4gICAgICBjb25zdCBkZWZsYXRlZFJlYWR5ID0gKGJ1ZmZlcikgPT4geyB0aGlzLndhaXREcmFpbiA9IHRoaXMuc29ja2V0LnNlbmQoYnVmZmVyKSB9XG4gICAgICB0aGlzLl9jb21wcmVzc2lvbiA9IG5ldyBDb21wcmVzc2lvbihpbmZsYXRlZFJlYWR5LCBkZWZsYXRlZFJlYWR5KVxuICAgIH1cblxuICAgIC8vIG92ZXJyaWRlIGRhdGEgaGFuZGxlciwgZGVjb21wcmVzcyBpbmNvbWluZyBkYXRhXG4gICAgdGhpcy5zb2NrZXQub25kYXRhID0gKGV2dCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmNvbXByZXNzZWQpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9jb21wcmVzc2lvbldvcmtlcikge1xuICAgICAgICB0aGlzLl9jb21wcmVzc2lvbldvcmtlci5wb3N0TWVzc2FnZShjcmVhdGVNZXNzYWdlKE1FU1NBR0VfSU5GTEFURSwgZXZ0LmRhdGEpLCBbZXZ0LmRhdGFdKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fY29tcHJlc3Npb24uaW5mbGF0ZShldnQuZGF0YSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVW5kb2VzIGFueSBjaGFuZ2VzIHJlbGF0ZWQgdG8gY29tcHJlc3Npb24uIFRoaXMgb25seSBiZSBjYWxsZWQgd2hlbiBjbG9zaW5nIHRoZSBjb25uZWN0aW9uXG4gICAqL1xuICBfZGlzYWJsZUNvbXByZXNzaW9uICgpIHtcbiAgICBpZiAoIXRoaXMuY29tcHJlc3NlZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5jb21wcmVzc2VkID0gZmFsc2VcbiAgICB0aGlzLnNvY2tldC5vbmRhdGEgPSB0aGlzLl9zb2NrZXRPbkRhdGFcbiAgICB0aGlzLl9zb2NrZXRPbkRhdGEgPSBudWxsXG5cbiAgICBpZiAodGhpcy5fY29tcHJlc3Npb25Xb3JrZXIpIHtcbiAgICAgIC8vIHRlcm1pbmF0ZSB0aGUgd29ya2VyXG4gICAgICB0aGlzLl9jb21wcmVzc2lvbldvcmtlci50ZXJtaW5hdGUoKVxuICAgICAgdGhpcy5fY29tcHJlc3Npb25Xb3JrZXIgPSBudWxsXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE91dGdvaW5nIHBheWxvYWQgbmVlZHMgdG8gYmUgY29tcHJlc3NlZCBhbmQgc2VudCB0byBzb2NrZXRcbiAgICpcbiAgICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gYnVmZmVyIE91dGdvaW5nIHVuY29tcHJlc3NlZCBhcnJheWJ1ZmZlclxuICAgKi9cbiAgX3NlbmRDb21wcmVzc2VkIChidWZmZXIpIHtcbiAgICAvLyBkZWZsYXRlXG4gICAgaWYgKHRoaXMuX2NvbXByZXNzaW9uV29ya2VyKSB7XG4gICAgICB0aGlzLl9jb21wcmVzc2lvbldvcmtlci5wb3N0TWVzc2FnZShjcmVhdGVNZXNzYWdlKE1FU1NBR0VfREVGTEFURSwgYnVmZmVyKSwgW2J1ZmZlcl0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uLmRlZmxhdGUoYnVmZmVyKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCBjcmVhdGVNZXNzYWdlID0gKG1lc3NhZ2UsIGJ1ZmZlcikgPT4gKHsgbWVzc2FnZSwgYnVmZmVyIH0pXG4iXX0=