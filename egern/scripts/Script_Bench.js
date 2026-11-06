/**
 * 脚本性能测试 · Egern 版
 *
 * 模块：egern/module/Script_Bench.yaml（http_request 脚本，匹配 ^http://example\.com/bench/）
 * Surge 版：surge/scripts/Script_Bench_Surge.js。两边的 heavyWork() 逐字相同，只有读请求和返回响应的写法不同
 * （Egern 用 ctx.request / ctx.respond，Surge 用 $request / $done）。改负载时两个文件要一起改。
 *
 *   http://example.com/bench/light  立即返回 ok：测每次调用的固定开销（引擎启动 + 进出脚本）
 *   http://example.com/bench/heavy  跑一段固定的计算负载，返回脚本内部耗时，如「85 ms (3102830)」
 *
 * 请求在脚本里直接返回响应，不走网络，结果不受线路和节点影响。
 * heavy 括号里的数字是校验值：两个 App 返回的一样，才说明跑的是同一份负载。
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

function reply(ctx, body) {
  return ctx.respond({
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    body: String(body),
  });
}

export default async function (ctx) {
  if (ctx.request.url.indexOf('/bench/heavy') !== -1) {
    var t0 = Date.now();
    var sink = heavyWork();
    return reply(ctx, Date.now() - t0 + ' ms (' + sink + ')');
  }
  return reply(ctx, 'ok');
}
