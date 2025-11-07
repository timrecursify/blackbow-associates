-- Add CASCADE delete to Transaction.userId foreign key
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_user_id_fkey";
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add CASCADE delete to Purchase.userId foreign key  
ALTER TABLE "purchases" DROP CONSTRAINT IF EXISTS "purchases_user_id_fkey";
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add CASCADE delete to PaymentMethod.userId foreign key
ALTER TABLE "payment_methods" DROP CONSTRAINT IF EXISTS "payment_methods_user_id_fkey";
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
