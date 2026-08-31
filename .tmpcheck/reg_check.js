
// PWA 注册：带版本号强制绕过 SW 脚本缓存，检测到新版本自动刷新
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js?v=4.2").then(function(reg){
    reg.addEventListener('updatefound',function(){
      var nw=reg.installing;
      if(nw) nw.addEventListener('statechange',function(){
        if(nw.state==='activated' && navigator.serviceWorker.controller){
          location.reload();
        }
      });
    });
  });
}
</script>