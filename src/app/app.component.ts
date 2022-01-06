import { Component } from '@angular/core';
const STAMPS = [ /*スタンプ画像(クイズ)の名前と場所*/
  {
    name: '0', /* 0番のスタンプ画像の名前を設定する*/
    imagePath: 'assets/stamps/1.jpg'　/* 0番のスタンプ画像の格納場所を設定する*/
  },
  {
    name: '1',　/* 1番のスタンプ画像の名前を設定する*/
    imagePath: 'assets/stamps/2.jpg' /* 1番のスタンプ画像の格納場所を設定する*/
  },
  {
    name: '2', /* 2番のスタンプ画像の名前を設定する*/
    imagePath: 'assets/stamps/3.jpg' /* 2番のスタンプ画像の格納場所を設定する*/
  },
  {
    name: '3', /* 3番のスタンプ画像の名前を設定する*/
    imagePath: 'assets/stamps/4.jpg' /* 3番のスタンプ画像の格納場所を設定する*/
  },
  {
    name: '4', /* 4番のスタンプ画像の名前を設定する*/
    imagePath: 'assets/stamps/5.jpg' /* 4番のスタンプ画像の格納場所を設定する*/
  },
  {
    name: '5', /* 5番のスタンプ画像の名前を設定する*/
    imagePath: 'assets/stamps/6.jpg' /* 5番のスタンプ画像の格納場所を設定する*/
  }
] as const;

/* スキャンするNFCカードをSTAMPSのシリアル番号と名前で設定して格納する*/
const NFCCardSerialNumberStampNameMap = new Map<string, typeof STAMPS[number]['name']>([
//['04:15:91:3a:42:be:20', '0'],/*0番のスタンプ画像のシリアル番号*/
  ['04:15:91:3a:47:5d:20', '0'],/*0番のスタンプ画像のシリアル番号*/  
  ['04:15:91:3a:62:50:20', '1'],/*1番のスタンプ画像のシリアル番号*/
  ['04:15:91:4a:79:17:20', '2'],/*2番のスタンプ画像のシリアル番号*/
  ['04:15:91:3a:47:a2:20', '3'],/*3番のスタンプ画像のシリアル番号*/
  ['04:15:91:3a:18:88:20', '4'],/*4番のスタンプ画像のシリアル番号*/
  ['04:15:91:2a:b4:6b:20', '5'],/*5番のスタンプ画像のシリアル番号*/
]);


@Component({ /* app.comporent.htmlでコンポーネントする*/
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'stamp-rally';
  stamps = STAMPS.map(stamp => {
    return {
      ...stamp,
      correct: false
    }
  });
  scanning = false;
  ndef?: NDEFReader;
  /* スタンプ画像をリセットする*/
  resetStamp() {
    var res = confirm("取得したスタンプ画像を全てリセットしますか？");
    if(res == true){
      //OKなら画像をリセットする
      for (const stamp of this.stamps) {
        stamp.correct = false;
      }
      var cookies = document.cookie; //全てのcookieを取り出して
      var cookiesArray = cookies.split(';'); // ;で分割し配列に
      for(var c of cookiesArray){ //一つ一つ取り出して
          var cArray = c.split('='); //さらに=で分割して配列に
          document.cookie = cArray[0].trim() + '=;max-age=0';
      }
    }else{
      //キャンセルならアラートを表示する。
      alert("リセットをキャンセルします。");
    }
  }
  /* スタートボタンを押すことでScanがスタートする。*/
  async start() {
    if (!this.scanning && !await this.startScan()) {
      return;
    }
    // @ts-ignore
    this.ndef!.addEventListener("reading", ({ serialNumber }) => { /* シリアル番号を読み取る*/
      const stampName = NFCCardSerialNumberStampNameMap.get(serialNumber);
      const stamp = this.stamps.find(stamp => stamp.name === stampName);
      if (stamp) {  
        var cookies = document.cookie; //全てのcookieを取り出して
        var cookiesArray = cookies.split(';'); // ;で分割し配列に
        var tmp = false;
        var count = 10;

        for(var c of cookiesArray){ //一つ一つ取り出して
            var cArray = c.split('='); //さらに=で分割して配列に
            // document.write(" [" + cArray[0] + ":" + cArray[1] + "] ");
            if(cArray[0].trim() == 'count'){ // 取り出したいkeyと合致したら
                console.log(cArray);  // [key,value]
                count = Number(cArray[1]);
                tmp = true;
                //0の時は1＋してカウントしてからtrueになる
            }
        }
        if (stamp.name == "0" && !tmp) {
          document.cookie = '0=1;expires=Tue, 19 Jan 2038 03:14:07 GMT';
          document.cookie = 'count=1;expires=Tue, 19 Jan 2038 03:14:07 GMT';
          stamp.correct = true;
        } else if(tmp) {
          if (Number(stamp.name) == count) {
            document.cookie = stampName + '=1;expires=Tue, 19 Jan 2038 03:14:07 GMT'; /*名前が `serialNumber` の Cookie=1 だけを更新する　また、2038年までキャシュを残す。*/
            document.cookie = 'count=' + (count + 1) + ';expires=Tue, 19 Jan 2038 03:14:07 GMT'; /*名前が `serialNumber` の Cookie=1 だけを更新する　また、2038年までキャシュを残す。*/
            stamp.correct = true;
          } else {
            // document.write("順番通りではない");  
            alert('順番通りのスタンプラリーを行って下さい');
          }
        } else {
          // document.write("0からスタートしてない"); 
          alert('1からスタートして下さい'); 
        }
        //document.write(document.cookie);
      }
    });
  }
  /* スタートボタンを押したときにChromeでNFCを設定していない場合にalertでエラーメッセージを表示する*/
  async startScan() {
    if (!('NDEFReader' in window)) {
      alert('設定でNFCを有効にしてください。');
      return false;
    }
    /* NDEFReaderでNFCカードをscanした場合、シリアル番号で文字列を区切り、履歴を残す*/
    this.ndef = new NDEFReader();
    await this.ndef.scan();
    this.scanning = true;
    //例でNFCカードをスキャンした場合、cookieでは1=1;2=1;3=1;4=1の状態で履歴が残る。
    document.cookie.split(';').forEach((value) => { /*;で区切ることで1=1で改行してから2=1と続く*/
      //1=1
      //2=1 ・・・
      let content = value.split('='); /*=で文字列を区切ることで1 1と分ける。*/
      //content[0]とcontent[1]は先ほどの例で1 1と分けられて右の1はcookie状態ではいらないので左のconten[0]のみ使用する。
      const stamp = this.stamps.find(stamp => stamp.name == content[0].replace(/\r?\n/g, "").trim()); /* stamp.nameは上記の0番とか1番でconten[0]とマッチした場合、空白(trim())や改行を抜いた状態で比較する*/
      //document.write("a" + content[0].replace(/\r?\n/g, "").trim() + "b");

      if (stamp) {
        //上記の比較がtureの時、スタンプ画像を表示する。
        stamp.correct = true;
        //document.write(stamp.name + " ");
      }
    });
    return true;
  }
}






