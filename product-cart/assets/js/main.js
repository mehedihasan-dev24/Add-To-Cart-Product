// Body loaded


window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});



// ADD TO CART APP

const initApp = function () {
    const jsonFile = "/data.json";

    // Fetch data from data.json file
    fetch(jsonFile)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            appendDataToDiv(data);
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
}
initApp();

const getImageUrl = function (product) {
    if (window.matchMedia("(max-width:599px)").matches) {
        console.log(product.image.mobile);
        return product.image.mobile;
    } else if (window.matchMedia("(min-width:600px) and (max-width:1199px)").matches) {
        console.log(product.image.tablet);
        return product.image.tablet;
    } else {
        console.log(product.image.desktop);
        return product.image.desktop;
    }
}

const getImageDimensions = function (product) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = getImageUrl(product);

        img.onload = function () {
            const dimensions = {
                width: img.width,
                height: img.height
            };
            resolve(dimensions);
        };
        img.onerror = function () {
            reject(new Error("Image failed to load"));
        };
    });
}

const appendDataToDiv = async function (products) {
    const listProductEl = document.getElementById('ProductList'); // Assuming ProductList is the ID of the div
    listProductEl.innerHTML = '';

    for (const product of products) {
        try {
            const dimensions = await getImageDimensions(product);
            console.log(`Image Dimensions: ${dimensions.width}x${dimensions.height}`);

            // Create the card element
            const card = document.createElement("div");
            card.classList.add("product_card");
            card.setAttribute("data-product-id", product.id);

            // Set inner HTML for the card
            card.innerHTML = `
                <div class="card_banner">
                    <figure class="img_holder" style="--width:${dimensions.width}px; --height:${dimensions.height}px;">
                        <img src="${getImageUrl(product)}" width="${dimensions.width}" height="${dimensions.height}" alt="${product.name}" class="img_cover responsive_image">
                    </figure>

                    <div class="btn">
                        <button class="add_to_cart" data-product-id = "${product.id}">
                            <img src="./assets/images/icon-add-to-cart.svg" alt="" class="cart_icon">
                            <span>Add to cart</span>
                        </button>

                        <div class="quantity_selector add_to_cart" id="quantitySelector_${product.id}" style="display: none;">
                            <button class="quantity_btn decrease_btn" id="decreaseBtn_${product.id}">-</button>
                            <input type="text" class = "quantityInput" id="quantityInput_${product.id}" value="1" readonly>
                            <button class="quantity_btn increase_btn" id="increaseBtn_${product.id}">+</button>
                        </div>
                    </div>
                </div>
                <div class="card_content">
                    <h2 class="category_name">${product.category}</h2>
                    <h1 class="card_title">${product.name}</h1>
                    <div class="card_price">$${product.price.toFixed(2)}</div>
                </div>
            `;

            // Append the card to the product list
            listProductEl.appendChild(card);
        } catch (error) {
            console.error("Error loading image dimensions:", error);
        }
    }

    // Attach event listeners to buttons after cards are appended
    const addToCartButtons = document.querySelectorAll(".add_to_cart");
    addToCartButtons.forEach(button => {
        button.addEventListener("click", function () {
            handleAddToCartClick(button, products);

        });
    });
}


let cartList = [];

const handleAddToCartClick = function (button, products) {
    const productId = button.getAttribute("data-product-id");
    const product = products.find(p => p.id == productId);

    if (product) {

        // ADD TO CART

        addToCart(product);

        toggleQuantityButton(productId, button);
    } else {
        console.error("Product is not found");
    }
}

const addToCart = function (product) {

    console.log(product);
    const existingProduct = cartList.find(item => item.id === product.id);

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cartList.push({ ...product, quantity: 1 });
    }

    updateCartListDisplay(product);
    updateTotalPrice();
}


const updateCartQuantity = function (productId, quantity) {
    cartList = cartList.map(product => {
        if (product.id == productId) {
            return { ...product, quantity: quantity };
        }
        return product;
    });
    updateCartListDisplay();
    updateTotalPrice();
};


// TOGGLE QUANTITY BUTTON
const toggleQuantityButton = function (productId, button) {
    button.style.display = 'none';
    const quantitySelector = document.getElementById(`quantitySelector_${productId}`);
    quantitySelector.style.display = 'flex';

    const imgHolder = button.closest('.card_banner').querySelector('.img_holder');
    imgHolder.classList.add('active');
};

// TOGGLE BACK TO ADD TO CART
const toggleBackToAddToCart = function (productId) {
    const quantitySelector = document.getElementById(`quantitySelector_${productId}`);
    const button = document.querySelector(`button[data-product-id="${productId}"]`);

    if (button) {
        quantitySelector.style.display = 'none';
        button.style.display = 'inline-flex';

        const imgHolder = button.closest('.card_banner').querySelector('.img_holder');
        imgHolder.classList.remove('active');
    }
};

document.addEventListener('click', function (event) {
    if (event.target.matches('.increase_btn')) {
        const productId = event.target.closest('.quantity_selector').getAttribute('id').split('_')[1];
        const cartItem = cartList.find(item => item.id == productId);

        if (cartItem) {
            cartItem.quantity += 1;
            const quantityInput = document.getElementById(`quantityInput_${productId}`);
            quantityInput.value = cartItem.quantity;
            updateCartQuantityCount();
            updateTotalPrice();
        }
    }

    if (event.target.matches('.decrease_btn')) {
        const productId = event.target.closest('.quantity_selector').getAttribute('id').split('_')[1];
        const cartItem = cartList.find(item => item.id == productId);

        if (cartItem && cartItem.quantity > 1) {
            cartItem.quantity -= 1;
            const quantityInput = document.getElementById(`quantityInput_${productId}`);
            quantityInput.value = cartItem.quantity;
            updateCartQuantityCount();
            updateTotalPrice();
        } else if (cartItem && cartItem.quantity === 1) {
            cartList = cartList.filter(item => item.id != productId);
            toggleBackToAddToCart(productId);
            updateCartQuantityCount();
            updateTotalPrice();
        }
    }


    // CROSS ICON CLICK FUNCTION
    const crossIconClick = function (crossIcon) {
        const cartItemEl = crossIcon.closest('.cart_item');
        const productId = cartItemEl.getAttribute('data-item-id');

        // Find the corresponding product in the cart list
        const product = cartList.find(item => item.id == productId);

        if (product) {
            // Update the quantity to 0 and remove it from the cart list
            product.quantity = 0;
            cartList = cartList.filter(item => item.id != productId);
        }

        // Find the corresponding product card
        const productCard = document.querySelector(`.product_card[data-product-id="${productId}"]`);

        if (productCard) {
            // Toggle back to the "Add to Cart" button
            const addToCartButton = productCard.querySelector('.add_to_cart');
            const quantitySelector = productCard.querySelector('.quantity_selector');
            quantitySelector.style.display = 'none';
            addToCartButton.style.display = 'inline-flex';

            // Remove the active class from img_holder
            const imgHolder = productCard.querySelector('.img_holder');
            imgHolder.classList.remove('active');

            // Reset the quantityInput value to its default (e.g., 1)
            const quantityInput = productCard.querySelector('.quantityInput');
            if (quantityInput) {
                quantityInput.value = 1; // or whatever the default value is
            }
        }

        // Update the cart UI
        updateCartListDisplay();
        updateCartQuantityCount();
        updateTotalPrice();
    };

    // Attach event listener to cross icons after rendering cart items
    const attachCrossIconClickListeners = function () {
        document.querySelectorAll('.cross_icon').forEach(crossIcon => {
            crossIcon.addEventListener('click', function () {
                crossIconClick(crossIcon);
            });
        });
    };

    // Example: After updating the cart list display, call this to attach listeners
    updateCartListDisplay();
    attachCrossIconClickListeners();


});



// UPDATE CART QUANTITY COUNT
const updateCartQuantityCount = function () {
    const totalQuantity = cartList.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.count_quantity').textContent = totalQuantity;
};




const updateCartListDisplay = function (products) {

    const /** {NodeElement} */ cartListEl = document.querySelector("[data-cart-list]");
    const quantityCount = document.querySelector(".count_quantity");

    cartListEl.innerHTML = '';

    let totalQuantity = 0;

    cartList.forEach((product) => {
        totalQuantity = totalQuantity + product.quantity;
        const /** {CreateElement} */ li = document.createElement("li");
        li.setAttribute("data-item-id", product.id);
        li.classList.add("cart_item");
        li.innerHTML = `

        <div class="item_details">
              <h2 class="card_title">${product.name}</h2>
              <div class="item_wrapper">
                <div class="quantity_count">${product.quantity}x</div>
                <div class="cart_price">@ $${product.price.toFixed(2)}</div>
                <div class="cart_m_price">$${(product.price * product.quantity).toFixed(2)}</div>
              </div>
            </div>

            <div class="cross_icon">
              <img src="./assets/images/icon-remove-item.svg" alt="">
            </div>

        `
        cartListEl.appendChild(li);
    })
    quantityCount.innerText = `(${totalQuantity})`;
}

const updateTotalPrice = function () {
    const /** {NodeElement} */ totalPriceEl = document.getElementById("totalPrice");

    let totalPrice = 0;

    cartList.forEach((product) => {
        totalPrice += product.price * product.quantity;
    })
    totalPriceEl.innerText = `$${totalPrice.toFixed(2)}`;
}
