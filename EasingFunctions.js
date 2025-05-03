function easeInOutSine(x) {return -(Math.cos(Math.PI * x) - 1) / 2}
function easeInOutSineWithPow(x,pow) 
{
    return Math.pow(-(Math.cos(Math.PI*x)-1)/2,pow)
}