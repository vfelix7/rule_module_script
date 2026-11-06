/**
 * 脚本性能测试 · Surge 版
 *
 * 模块：surge/module/Script_Bench_Surge.sgmodule（http-request 脚本，匹配 ^http://example\.com/bench/）
 * Egern 版：egern/scripts/Script_Bench.js。两边的 heavyWork() 逐字相同，只有读请求和返回响应的写法不同
 * （Surge 用 $request / $done，Egern 用 ctx.request / ctx.respond）。改负载时两个文件要一起改。
 *
 *   http://example.com/bench/light  立即返回 ok：测每次调用的固定开销（引擎启动 + 进出脚本）
 *   http://example.com/bench/heavy  跑一段固定的计算负载，返回脚本内部耗时，如「85 ms (3102830)」
 *
 * 请求在脚本里直接返回响应，不走网络，结果不受线路和节点影响。
 * heavy 括号里的数字是校验值：两个 App 返回的一样，才说明跑的是同一份负载。
 * 模块参数 Engine 可选 webview / jsc / auto，用来对比 Surge 的两套脚本引擎。
 */

// 构造一份约 380KB 的 JSON（模拟一个较大的 API 响应），重复 10 轮：
// 解析 → 过滤掉「广告」条目 → 序列化 → 正则替换。这正是去广告、改响应类脚本最常做的事。
function heavyWork() {
  var items = [];
  for (var i = 0; i < 5000; i++) {
    items.push({ id: i, name: 'item-' + i, tags: ['a', 'b', 'c'], price: i * 1.5, ad: i % 7 === 0 });
  }
  var base = JSON.stringify({ items: items });

  var sink = 0;
  for (var r = 0; r < 10; r++) {
    var obj = JSON.parse(base);
    obj.items = obj.items.filter(function (x) {
      return !x.ad;
    });
    var out = JSON.stringify(obj).replace(/item-(\d+)/g, 'x$1');
    sink += out.length;
  }
  return sink; // 返回出去，防止引擎把计算优化掉
}

function reply(body) {
  $done({
    response: {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      body: String(body),
    },
  });
}

if ($request.url.indexOf('/bench/heavy') !== -1) {
  var t0 = Date.now();
  var sink = heavyWork();
  reply(Date.now() - t0 + ' ms (' + sink + ')');
} else {
  reply('ok');
}
