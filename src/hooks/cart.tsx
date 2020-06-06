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

const PROGRAM_KEY_NAME = '@GoMarketplace:products';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(PROGRAM_KEY_NAME);

      storagedProducts
        ? setProducts(JSON.parse(storagedProducts))
        : setProducts([]);
    }

    loadProducts();
  }, []);

  const updateAsyncStorage = useCallback(async items => {
    await AsyncStorage.setItem(PROGRAM_KEY_NAME, JSON.stringify(items));
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.findIndex(item => item.id === product.id);
      const updatedProducts = [...products];

      if (productExists >= 0) {
        updatedProducts[productExists].quantity += 1;
        setProducts(updatedProducts);
      } else {
        setProducts([...updatedProducts, { ...product, quantity: 1 }]);
      }

      updateAsyncStorage(products);
    },
    [products, updateAsyncStorage],
  );

  const increment = useCallback(
    async id => {
      const indexProduct = products.findIndex(item => item.id === id);
      const updatedProducts = [...products];
      updatedProducts[indexProduct].quantity += 1;

      setProducts(updatedProducts);

      updateAsyncStorage(updatedProducts);
    },
    [products, updateAsyncStorage],
  );

  const decrement = useCallback(
    async id => {
      const indexProduct = products.findIndex(item => item.id === id);
      const updatedProducts = [...products];
      if (updatedProducts[indexProduct].quantity === 1) {
        setProducts(updatedProducts.splice(indexProduct, 1));
      } else {
        updatedProducts[indexProduct].quantity -= 1;
        setProducts(updatedProducts);
      }

      setProducts(updatedProducts);
      updateAsyncStorage(updatedProducts);
    },
    [products, updateAsyncStorage],
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
