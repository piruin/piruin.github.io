
(function(){
    document.addEventListener('DOMContentLoaded', function(){
        var children = document.getElementsByClassName('piruin-rolling-title')[0].children;
        var length = children.length;
        var idx = 0;
        setInterval(function(){
            children[idx].className = "hidden";
            idx = (idx + 1) % length;
            children[idx].className = "visible";
        }, 5000);
    });
})();
