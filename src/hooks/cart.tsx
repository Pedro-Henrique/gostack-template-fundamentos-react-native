import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartProducts = await AsyncStorage.getItem(
        '@GoMarketplace:cartProducts',
      );

      if (cartProducts) {
        setProducts([...JSON.parse(cartProducts)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProd = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(newProd);

      await AsyncStorage.setItem(
        '@GoMarketplace:cartProducts',
        JSON.stringify(newProd),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const exist = products.find(prod => prod.id === product.id);

      if (exist) {
        const newProd = products.map(prod =>
          prod.id === product.id
            ? { ...product, quantity: prod.quantity + 1 }
            : prod,
        );

        setProducts(newProd);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cartProducts',
        JSON.stringify(products),
      );

      console.log('CART: ', products);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const exist = products.find(prod => prod.id === id);

      if (exist) {
        if (exist.quantity === 1) {
          setProducts(products.filter(product => product.id !== id));
        } else {
          const newProd = products.map(product =>
            product.id === id
              ? { ...product, quantity: product.quantity - 1 }
              : product,
          );

          setProducts(newProd);

          await AsyncStorage.setItem(
            '@GoMarketplace:cartProducts',
            JSON.stringify(newProd),
          );
        }
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cartProducts',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
