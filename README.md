```
-- Table: public.category

-- DROP TABLE IF EXISTS public.category;

CREATE TABLE IF NOT EXISTS public.category
(
    category_id integer NOT NULL DEFAULT nextval('category_category_id_seq'::regclass),
    category_name character varying(30) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT category_id_pk PRIMARY KEY (category_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.category
    OWNER to postgres;`

```
```
-- Table: public.order_item

-- DROP TABLE IF EXISTS public.order_item;

CREATE TABLE IF NOT EXISTS public.order_item
(
    order_item_id integer NOT NULL DEFAULT nextval('order_item_order_item_id_seq'::regclass),
    cart_date timestamp with time zone NOT NULL DEFAULT now(),
    user_id integer,
    CONSTRAINT order_item_id_pk PRIMARY KEY (order_item_id),
    CONSTRAINT user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public."user" (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.order_item
    OWNER to postgres;

```
```
-- Table: public.orders

-- DROP TABLE IF EXISTS public.orders;

CREATE TABLE IF NOT EXISTS public.orders
(
    orders_id integer NOT NULL DEFAULT nextval('orders_orders_id_seq'::regclass),
    user_id integer,
    order_date timestamp with time zone NOT NULL DEFAULT now(),
    order_item_id integer,
    CONSTRAINT orders_id_pk PRIMARY KEY (orders_id),
    CONSTRAINT order_item_id_fkey FOREIGN KEY (order_item_id)
        REFERENCES public.order_item (order_item_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public."user" (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.orders
    OWNER to postgres;
```
```
-- Table: public.product

-- DROP TABLE IF EXISTS public.product;

CREATE TABLE IF NOT EXISTS public.product
(
    product_id integer NOT NULL DEFAULT nextval('product_product_id_seq'::regclass),
    product_name character varying(50) COLLATE pg_catalog."default" NOT NULL,
    description character varying(250) COLLATE pg_catalog."default" NOT NULL,
    price integer NOT NULL,
    category_id integer,
    photo character varying(250) COLLATE pg_catalog."default" NOT NULL,
    size character varying(1) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT product_id_pk PRIMARY KEY (product_id),
    CONSTRAINT category_id_fkey FOREIGN KEY (category_id)
        REFERENCES public.category (category_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.product
    OWNER to postgres;
```
```

    -- Table: public.products_cart

-- DROP TABLE IF EXISTS public.products_cart;

CREATE TABLE IF NOT EXISTS public.products_cart
(
    products_cart_id integer NOT NULL DEFAULT nextval('products_cart_products_cart_id_seq'::regclass),
    order_item_id integer,
    product_id integer,
    quantity integer NOT NULL,
    CONSTRAINT products_cart_id_pk PRIMARY KEY (products_cart_id),
    CONSTRAINT order_item_id_fkey FOREIGN KEY (order_item_id)
        REFERENCES public.order_item (order_item_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT product_id_fkey FOREIGN KEY (product_id)
        REFERENCES public.product (product_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.products_cart
    OWNER to postgres;
```
```

    -- Table: public.reviews

-- DROP TABLE IF EXISTS public.reviews;

CREATE TABLE IF NOT EXISTS public.reviews
(
    reviews_id integer NOT NULL DEFAULT nextval('reviews_reviews_id_seq'::regclass),
    product_id integer,
    user_id integer,
    rating integer NOT NULL,
    comment character varying(250) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT reviews_id_pk PRIMARY KEY (reviews_id),
    CONSTRAINT product_id_fkey FOREIGN KEY (product_id)
        REFERENCES public.product (product_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public."user" (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.reviews
    OWNER to postgres;
```
```

    -- Table: public.user

-- DROP TABLE IF EXISTS public."user";

CREATE TABLE IF NOT EXISTS public."user"
(
    user_id integer NOT NULL DEFAULT nextval('user_user_id_seq'::regclass),
    username character varying(100) COLLATE pg_catalog."default" NOT NULL,
    password character varying(100) COLLATE pg_catalog."default" NOT NULL,
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    phone character varying(15) COLLATE pg_catalog."default" NOT NULL,
    registration_date timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_id_pk PRIMARY KEY (user_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."user"
    OWNER to postgres;
```
