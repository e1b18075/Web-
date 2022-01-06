document.addEventListener('DOMContentLoaded', function(){ 
    document.getElementById("menuButton").addEventListener("click", function(){
        this.classList.toggle("active");
        document.getElementById("nav").classList.toggle("active");
    })
});