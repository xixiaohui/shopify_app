/**
 * Storefront product configurator.
 *
 * Renders option selectors for the product embedded in the block's JSON
 * script tag, keeps a live price in sync with the selected variant, and
 * adds the variant to the cart via the Ajax API.
 */
class ProductConfigurator extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;

    const dataEl = this.querySelector("[data-configurator-product]");
    this.body = this.querySelector("[data-configurator-body]");
    if (!dataEl || !this.body) return;

    try {
      this.product = JSON.parse(dataEl.textContent);
    } catch {
      return;
    }

    this.currency = this.dataset.currency || "USD";
    this.showPrice = this.dataset.showPrice !== "false";
    this.buttonLabel = this.dataset.buttonLabel || "Add to cart";
    this.selectedOptions = this.product.options.map((option) => option.values[0]);

    this.render();
  }

  get selectedVariant() {
    return this.product.variants.find((variant) =>
      variant.options.every((value, index) => value === this.selectedOptions[index]),
    );
  }

  formatMoney(cents) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: this.currency,
      }).format(cents / 100);
    } catch {
      return (cents / 100).toFixed(2);
    }
  }

  render() {
    this.body.innerHTML = "";

    this.product.options.forEach((option, optionIndex) => {
      const group = document.createElement("fieldset");
      group.className = "configurator__option";

      const legend = document.createElement("legend");
      legend.className = "configurator__option-name";
      legend.textContent = option.name;
      group.appendChild(legend);

      const values = document.createElement("div");
      values.className = "configurator__values";

      option.values.forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "configurator__value";
        button.textContent = value;
        button.setAttribute("aria-pressed", String(this.selectedOptions[optionIndex] === value));
        if (this.selectedOptions[optionIndex] === value) {
          button.classList.add("is-selected");
        }
        button.addEventListener("click", () => {
          this.selectedOptions[optionIndex] = value;
          this.render();
        });
        values.appendChild(button);
      });

      group.appendChild(values);
      this.body.appendChild(group);
    });

    const footer = document.createElement("div");
    footer.className = "configurator__footer";

    if (this.showPrice) {
      const price = document.createElement("span");
      price.className = "configurator__price";
      const variant = this.selectedVariant;
      price.textContent = variant ? this.formatMoney(variant.price) : "";
      footer.appendChild(price);
    }

    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "configurator__submit";
    const variant = this.selectedVariant;
    if (!variant) {
      submit.textContent = "Unavailable";
      submit.disabled = true;
    } else if (!variant.available) {
      submit.textContent = "Sold out";
      submit.disabled = true;
    } else {
      submit.textContent = this.buttonLabel;
      submit.addEventListener("click", () => this.addToCart(submit, variant));
    }
    footer.appendChild(submit);

    this.body.appendChild(footer);
  }

  async addToCart(button, variant) {
    button.disabled = true;
    const originalLabel = button.textContent;
    button.textContent = "Adding…";

    try {
      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ items: [{ id: variant.id, quantity: 1 }] }),
      });

      if (!response.ok) throw new Error(`Cart request failed: ${response.status}`);

      button.textContent = "Added ✓";
      document.dispatchEvent(new CustomEvent("cart:refresh", { bubbles: true }));
    } catch (error) {
      console.error("[configurator] add to cart failed", error);
      button.textContent = "Error — try again";
    } finally {
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalLabel;
      }, 1500);
    }
  }
}

if (!customElements.get("product-configurator")) {
  customElements.define("product-configurator", ProductConfigurator);
}
