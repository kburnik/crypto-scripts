// Compute earnings from trade history on bitpanda.com

/** Simple filter by conjunctive field equality check. */
Array.prototype.filterFieldEq = function(filterMap) {
  return $(this).filter(function(){
    var el = this;
    for (var fieldName in filterMap) {
      if (el[fieldName] != filterMap[fieldName]) {
        return false;
      }
    }
    return true;
  }).get();
};

Array.prototype.sum = function(colName) {
  return this.reduce((acc, curr) => acc + curr, 0);
}

Array.prototype.getColumn = function(colName) {
  return this.map(t => t[colName])
}

var colNames = $(".table-account th").map(function() {
  return $(this).text();
}).get();

var data = $(".table-account tr:gt(0)").map(function() {
  return [$(this).find("td").map(function(el, i) {
    return $(this).text();
  }).get()]
}).get();

function identity(v) {
  return v;
}

function parsePrice(v) {
   return parseFloat(v.replace('EUR', '').replace('BTC', '').replace(',', ''));
}

var fieldTransform = {
  "Price": parsePrice,
  "Amount": parsePrice,
  "Cryptocoin": parsePrice
};

var parsed = $(data).map(function() {
  var row = $(this).get();
  var m = {};
  for (var i = 0; i < colNames.length; i++) {
    var colName = colNames[i];
    transform = identity;
    if (colName in fieldTransform)  {
      transform = fieldTransform[colName];
    }
    m[colName] = transform(row[i]);
  }
  return m;
}).get();

function toHrk(v) {
   return v * EUR_VALUE_HRK;
}

//

var EUR_VALUE_HRK = 7.5;

var buys = parsed.filterFieldEq({"Status": "Finished", "Ordertype": "Buy"});
var totalBuyCrypto = buys.getColumn("Cryptocoin").sum();
var totalBuyEur = buys.getColumn("Amount").sum();

var sells = parsed.filterFieldEq({"Status": "Finished", "Ordertype": "Sell"});
var totalSellCrypto = sells.getColumn("Cryptocoin").sum();
var totalSellEur = sells.getColumn("Amount").sum();

var avgBuyEur =
    buys.map(t => (t.Amount / totalBuyEur * t.Price)).sum();

var diffCrypto = totalBuyCrypto - totalSellCrypto;
var diffEur = totalBuyEur - totalSellEur;

var heldElsewhereCrypto =
    parseFloat(prompt("How much BTC is held elsewhere (e.g. Poloniex)?"))
var heldCrypto = parseFloat($(".walletBalanceHeader a").text().trim());
var totalHeldCrypto = heldCrypto + heldElsewhereCrypto;

var currentBtcPrice;
var heldEur;
var earnEur;
var diffNowEur;

function compute(price) {
  console.clear();
  currentBtcPrice = price;
  heldEur = totalHeldCrypto * currentBtcPrice;
  earnEur = heldEur - totalBuyEur + totalSellEur;
  diffNowEur = diffCrypto * currentBtcPrice;

  console.log("1 EUR =", EUR_VALUE_HRK , "HRK");
  console.log("1 BTC =", currentBtcPrice, toHrk(currentBtcPrice));
  console.log("Total bought", totalBuyCrypto, totalBuyEur, toHrk(totalBuyEur));
  console.log("Total sold", totalSellCrypto, totalSellEur, toHrk(totalSellEur));
  console.log("Bought - sold", diffCrypto, diffEur, toHrk(diffEur));
  console.log("Bought - sold value", diffCrypto, diffNowEur, toHrk(diffNowEur));
  console.log("Current holdings", totalHeldCrypto, heldEur, toHrk(heldEur));
  console.log("Weighted average buy price", avgBuyEur, toHrk(avgBuyEur));
  console.log("Estimated earnings", earnEur, toHrk(earnEur));
}

var xhr = $.getJSON('/cryptocoins/getPrice/1/sell', function(sellPrices) {
  $.getJSON('/cryptocoins/getPrice/1/buy', function(buyPrices) {
    var btcPrice = (sellPrices[1] + buyPrices[1]) / 2;
    console.log(buyPrices, sellPrices, btcPrice);
   compute(btcPrice);
  });
});
