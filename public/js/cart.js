// Cập nhật lại số lượng sản phẩm trong giỏ hàng
const inputQuantity= document.querySelectorAll("input[name='quantity']");
if(inputQuantity.length>0){
    inputQuantity.forEach(input=>{
        input.addEventListener("change",()=>{
            const productId= input.getAttribute("product-id");
            const quantity= input.value;
            window.location.href=`/cart/update/${productId}/${quantity}`;
        });
    });
};
// End Cập nhật lại số lượng sản phẩm trong giỏ hàng