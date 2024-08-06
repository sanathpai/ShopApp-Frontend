import React, { createContext, useState, useContext } from 'react';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const [shopCount, setShopCount] = useState(0);

  return (
    <ShopContext.Provider value={{ shopCount, setShopCount }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShopContext = () => useContext(ShopContext);

export default ShopContext;
