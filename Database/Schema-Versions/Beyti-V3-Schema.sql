/* ================================================================
   BEYTI V2.1 - COMPLETE DATABASE SCHEMA
   Enhanced with Customer, Address, and Service Booking Systems
   ================================================================ */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* =========================
   DROP TABLES (reverse dependency order)
   ========================= */
IF OBJECT_ID('dbo.Announcements','U')              IS NOT NULL DROP TABLE dbo.Announcements;
IF OBJECT_ID('dbo.AdminProfile','U')               IS NOT NULL DROP TABLE dbo.AdminProfile;
IF OBJECT_ID('dbo.AuditLogs','U')                  IS NOT NULL DROP TABLE dbo.AuditLogs;
IF OBJECT_ID('dbo.Message','U')                    IS NOT NULL DROP TABLE dbo.Message;
IF OBJECT_ID('dbo.Notification','U')               IS NOT NULL DROP TABLE dbo.Notification;
IF OBJECT_ID('dbo.ServiceReview','U')              IS NOT NULL DROP TABLE dbo.ServiceReview;
IF OBJECT_ID('dbo.Review','U')                     IS NOT NULL DROP TABLE dbo.Review;
IF OBJECT_ID('dbo.ServiceBooking','U')             IS NOT NULL DROP TABLE dbo.ServiceBooking;
IF OBJECT_ID('dbo.TimeSlot','U')                   IS NOT NULL DROP TABLE dbo.TimeSlot;
IF OBJECT_ID('dbo.DeliveryTicket','U')             IS NOT NULL DROP TABLE dbo.DeliveryTicket;
IF OBJECT_ID('dbo.Payment','U')                    IS NOT NULL DROP TABLE dbo.Payment;
IF OBJECT_ID('dbo.OrderItem','U')                  IS NOT NULL DROP TABLE dbo.OrderItem;
IF OBJECT_ID('dbo.Orders','U')                     IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.ProductVariant','U')             IS NOT NULL DROP TABLE dbo.ProductVariant;
IF OBJECT_ID('dbo.VariantValue','U')               IS NOT NULL DROP TABLE dbo.VariantValue;
IF OBJECT_ID('dbo.VariantOption','U')              IS NOT NULL DROP TABLE dbo.VariantOption;
IF OBJECT_ID('dbo.Product','U')                    IS NOT NULL DROP TABLE dbo.Product;
IF OBJECT_ID('dbo.Gender','U')                     IS NOT NULL DROP TABLE dbo.Gender;
IF OBJECT_ID('dbo.ProviderCertificate','U')        IS NOT NULL DROP TABLE dbo.ProviderCertificate;
IF OBJECT_ID('dbo.ProviderApplicationService','U') IS NOT NULL DROP TABLE dbo.ProviderApplicationService;
IF OBJECT_ID('dbo.ProviderApplication','U')        IS NOT NULL DROP TABLE dbo.ProviderApplication;
IF OBJECT_ID('dbo.ServiceCatalog','U')             IS NOT NULL DROP TABLE dbo.ServiceCatalog;
IF OBJECT_ID('dbo.SubCategory','U')                IS NOT NULL DROP TABLE dbo.SubCategory;
IF OBJECT_ID('dbo.Category','U')                   IS NOT NULL DROP TABLE dbo.Category;
IF OBJECT_ID('dbo.ServiceProviderAddress','U')     IS NOT NULL DROP TABLE dbo.ServiceProviderAddress;
IF OBJECT_ID('dbo.SellerAddress','U')              IS NOT NULL DROP TABLE dbo.SellerAddress;
IF OBJECT_ID('dbo.CustomerAddress','U')            IS NOT NULL DROP TABLE dbo.CustomerAddress;
IF OBJECT_ID('dbo.Address','U')                    IS NOT NULL DROP TABLE dbo.Address;
IF OBJECT_ID('dbo.UserMembership','U')             IS NOT NULL DROP TABLE dbo.UserMembership;
IF OBJECT_ID('dbo.MembershipPlan','U')             IS NOT NULL DROP TABLE dbo.MembershipPlan;
IF OBJECT_ID('dbo.Driver','U')                     IS NOT NULL DROP TABLE dbo.Driver;
IF OBJECT_ID('dbo.ServiceProvider','U')            IS NOT NULL DROP TABLE dbo.ServiceProvider;
IF OBJECT_ID('dbo.Seller','U')                     IS NOT NULL DROP TABLE dbo.Seller;
IF OBJECT_ID('dbo.Customer','U')                   IS NOT NULL DROP TABLE dbo.Customer;
IF OBJECT_ID('dbo.UserProfile','U')                IS NOT NULL DROP TABLE dbo.UserProfile;
GO

/* =========================
   CREATE TABLES (parent → child order)
   ========================= */

/* ========== CORE USER SYSTEM ========== */

-- Core user profile (links to ASP.NET Identity)
CREATE TABLE dbo.UserProfile(
    Id             INT IDENTITY(1,1) CONSTRAINT PK_UserProfile PRIMARY KEY,
    IdentityUserId NVARCHAR(450) NULL,
    DisplayName    NVARCHAR(100) NULL,
    RoleType       NVARCHAR(30) NOT NULL,
    Status         NVARCHAR(20) NOT NULL DEFAULT('Active'),
    CreatedAt      DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt      DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME())
);
CREATE UNIQUE INDEX UX_UserProfile_IdentityUserId 
    ON dbo.UserProfile(IdentityUserId) WHERE IdentityUserId IS NOT NULL;
GO

-- Customer profile (NEW)
CREATE TABLE dbo.Customer(
    Id            INT IDENTITY(1,1) CONSTRAINT PK_Customer PRIMARY KEY,
    UserProfileId INT NOT NULL UNIQUE,
    Phone         NVARCHAR(30) NOT NULL,
    CreatedAt     DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt     DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Customer_UserProfile 
        FOREIGN KEY(UserProfileId) REFERENCES dbo.UserProfile(Id)
);
CREATE INDEX IX_Customer_UserProfile ON dbo.Customer(UserProfileId);
GO

-- Seller profile (MODIFIED - added Phone)
CREATE TABLE dbo.Seller(
    Id            INT IDENTITY(1,1) CONSTRAINT PK_Seller PRIMARY KEY,
    UserProfileId INT NOT NULL UNIQUE,
    StoreName     NVARCHAR(120) NOT NULL,
    Phone         NVARCHAR(30) NULL,
    CreatedAt     DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt     DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Seller_UserProfile 
        FOREIGN KEY(UserProfileId) REFERENCES dbo.UserProfile(Id)
);
CREATE INDEX IX_Seller_UserProfile ON dbo.Seller(UserProfileId);
GO

-- Service Provider profile (MODIFIED - added Phone and pricing range)
CREATE TABLE dbo.ServiceProvider(
    Id                INT IDENTITY(1,1) CONSTRAINT PK_ServiceProvider PRIMARY KEY,
    UserProfileId     INT NOT NULL UNIQUE,
    BusinessName      NVARCHAR(120) NOT NULL,
    Phone             NVARCHAR(30) NULL,
    MinServicePrice   DECIMAL(10,2) NULL,
    MaxServicePrice   DECIMAL(10,2) NULL,
    Status            NVARCHAR(20) NOT NULL DEFAULT('Pending'),
    VerifiedAt        DATETIME2(3) NULL,
    CreatedAt         DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt         DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_ServiceProvider_UserProfile 
        FOREIGN KEY(UserProfileId) REFERENCES dbo.UserProfile(Id),
    CONSTRAINT CK_ServiceProvider_PriceRange 
        CHECK (MinServicePrice IS NULL OR MaxServicePrice IS NULL OR MinServicePrice <= MaxServicePrice)
);
CREATE INDEX IX_ServiceProvider_UserProfile ON dbo.ServiceProvider(UserProfileId);
GO

-- Driver profile
CREATE TABLE dbo.Driver(
    Id            INT IDENTITY(1,1) CONSTRAINT PK_Driver PRIMARY KEY,
    UserProfileId INT NOT NULL UNIQUE,
    Phone         NVARCHAR(30) NOT NULL,
    Status        NVARCHAR(20) NOT NULL DEFAULT('Available'),
    CreatedAt     DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt     DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Driver_UserProfile 
        FOREIGN KEY(UserProfileId) REFERENCES dbo.UserProfile(Id)
);
CREATE INDEX IX_Driver_UserProfile ON dbo.Driver(UserProfileId);
GO

/* ========== ADDRESS SYSTEM (NEW) ========== */

-- Central address table for all entities
CREATE TABLE dbo.Address(
    Id          INT IDENTITY(1,1) CONSTRAINT PK_Address PRIMARY KEY,
    Label       NVARCHAR(50) NULL,
    Street      NVARCHAR(200) NOT NULL,
    City        NVARCHAR(100) NOT NULL,
    Region      NVARCHAR(100) NULL,
    PostalCode  NVARCHAR(20) NULL,
    Country     NVARCHAR(60) NOT NULL DEFAULT('Bahrain'),
    Latitude    DECIMAL(10,7) NULL,
    Longitude   DECIMAL(10,7) NULL,
    IsDefault   BIT NOT NULL DEFAULT(0),
    IsActive    BIT NOT NULL DEFAULT(1),
    CreatedAt   DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt   DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME())
);
CREATE INDEX IX_Address_Active ON dbo.Address(IsActive);
GO

-- Customer addresses (many-to-many)
CREATE TABLE dbo.CustomerAddress(
    Id         INT IDENTITY(1,1) CONSTRAINT PK_CustomerAddress PRIMARY KEY,
    CustomerId INT NOT NULL,
    AddressId  INT NOT NULL,
    CONSTRAINT FK_CustomerAddress_Customer 
        FOREIGN KEY(CustomerId) REFERENCES dbo.Customer(Id) ON DELETE CASCADE,
    CONSTRAINT FK_CustomerAddress_Address 
        FOREIGN KEY(AddressId) REFERENCES dbo.Address(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_CustomerAddress UNIQUE(CustomerId, AddressId)
);
CREATE INDEX IX_CustomerAddress_Customer ON dbo.CustomerAddress(CustomerId);
CREATE INDEX IX_CustomerAddress_Address ON dbo.CustomerAddress(AddressId);
GO

-- Seller addresses (shop locations)
CREATE TABLE dbo.SellerAddress(
    Id        INT IDENTITY(1,1) CONSTRAINT PK_SellerAddress PRIMARY KEY,
    SellerId  INT NOT NULL,
    AddressId INT NOT NULL,
    CONSTRAINT FK_SellerAddress_Seller 
        FOREIGN KEY(SellerId) REFERENCES dbo.Seller(Id) ON DELETE CASCADE,
    CONSTRAINT FK_SellerAddress_Address 
        FOREIGN KEY(AddressId) REFERENCES dbo.Address(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_SellerAddress UNIQUE(SellerId, AddressId)
);
CREATE INDEX IX_SellerAddress_Seller ON dbo.SellerAddress(SellerId);
CREATE INDEX IX_SellerAddress_Address ON dbo.SellerAddress(AddressId);
GO

-- Service Provider addresses
CREATE TABLE dbo.ServiceProviderAddress(
    Id                INT IDENTITY(1,1) CONSTRAINT PK_ServiceProviderAddress PRIMARY KEY,
    ServiceProviderId INT NOT NULL,
    AddressId         INT NOT NULL,
    CONSTRAINT FK_ServiceProviderAddress_Provider 
        FOREIGN KEY(ServiceProviderId) REFERENCES dbo.ServiceProvider(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ServiceProviderAddress_Address 
        FOREIGN KEY(AddressId) REFERENCES dbo.Address(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_ServiceProviderAddress UNIQUE(ServiceProviderId, AddressId)
);
CREATE INDEX IX_ServiceProviderAddress_Provider ON dbo.ServiceProviderAddress(ServiceProviderId);
CREATE INDEX IX_ServiceProviderAddress_Address ON dbo.ServiceProviderAddress(AddressId);
GO

/* ========== MEMBERSHIP SYSTEM ========== */

CREATE TABLE dbo.MembershipPlan(
    Id           INT IDENTITY(1,1) CONSTRAINT PK_MembershipPlan PRIMARY KEY,
    Name         NVARCHAR(50) NOT NULL,
    Description  NVARCHAR(255) NULL,
    MonthlyPrice DECIMAL(10,2) NOT NULL DEFAULT(0),
    DurationDays INT NULL,
    IsActive     BIT NOT NULL DEFAULT(1),
    CreatedAt    DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME())
);
GO

CREATE TABLE dbo.UserMembership(
    Id               INT IDENTITY(1,1) CONSTRAINT PK_UserMembership PRIMARY KEY,
    UserProfileId    INT NOT NULL,
    MembershipPlanId INT NOT NULL,
    StartDate        DATE NOT NULL,
    EndDate          DATE NOT NULL,
    Status           NVARCHAR(20) NOT NULL,
    AutoRenew        BIT NOT NULL DEFAULT(0),
    CreatedAt        DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_UserMembership_UserProfile 
        FOREIGN KEY(UserProfileId) REFERENCES dbo.UserProfile(Id),
    CONSTRAINT FK_UserMembership_Plan 
        FOREIGN KEY(MembershipPlanId) REFERENCES dbo.MembershipPlan(Id)
);
CREATE INDEX IX_UserMembership_User ON dbo.UserMembership(UserProfileId);
CREATE INDEX IX_UserMembership_Plan ON dbo.UserMembership(MembershipPlanId);
GO

/* ========== PRODUCT CATALOG SYSTEM ========== */

-- Category hierarchy
CREATE TABLE dbo.Category(
    Id        INT IDENTITY(1,1) CONSTRAINT PK_Category PRIMARY KEY,
    Name      NVARCHAR(60) NOT NULL,
    IsActive  BIT NOT NULL DEFAULT(1),
    CreatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME())
);
GO

CREATE TABLE dbo.SubCategory(
    Id         INT IDENTITY(1,1) CONSTRAINT PK_SubCategory PRIMARY KEY,
    CategoryId INT NOT NULL,
    Name       NVARCHAR(80) NOT NULL,
    IsActive   BIT NOT NULL DEFAULT(1),
    CreatedAt  DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_SubCategory_Category 
        FOREIGN KEY(CategoryId) REFERENCES dbo.Category(Id)
);
CREATE INDEX IX_SubCategory_Category ON dbo.SubCategory(CategoryId);
GO

-- Gender lookup for clothing
CREATE TABLE dbo.Gender(
    Id   TINYINT CONSTRAINT PK_Gender PRIMARY KEY,
    Name NVARCHAR(16) NOT NULL UNIQUE
);
INSERT dbo.Gender(Id, Name) VALUES (1,N'Men'),(2,N'Women'),(3,N'Unisex'),(4,N'Kids');
GO

-- Products
CREATE TABLE dbo.Product(
    Id            INT IDENTITY(1,1) CONSTRAINT PK_Product PRIMARY KEY,
    SellerId      INT NOT NULL,
    SubCategoryId INT NOT NULL,
    GenderId      TINYINT NULL,
    Name          NVARCHAR(150) NOT NULL,
    Description   NVARCHAR(MAX) NULL,
    BasePrice     DECIMAL(10,2) NOT NULL CHECK (BasePrice >= 0),
    IsActive      BIT NOT NULL DEFAULT(1),
    CreatedAt     DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt     DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Product_Seller 
        FOREIGN KEY(SellerId) REFERENCES dbo.Seller(Id),
    CONSTRAINT FK_Product_SubCategory 
        FOREIGN KEY(SubCategoryId) REFERENCES dbo.SubCategory(Id),
    CONSTRAINT FK_Product_Gender 
        FOREIGN KEY(GenderId) REFERENCES dbo.Gender(Id)
);
CREATE INDEX IX_Product_Seller ON dbo.Product(SellerId);
CREATE INDEX IX_Product_SubCat ON dbo.Product(SubCategoryId);
CREATE INDEX IX_Product_SubCat_Gender ON dbo.Product(SubCategoryId, GenderId);
GO

-- Variant system
CREATE TABLE dbo.VariantOption(
    Id   INT IDENTITY(1,1) CONSTRAINT PK_VariantOption PRIMARY KEY,
    Name NVARCHAR(40) NOT NULL
);
GO

CREATE TABLE dbo.VariantValue(
    Id              INT IDENTITY(1,1) CONSTRAINT PK_VariantValue PRIMARY KEY,
    VariantOptionId INT NOT NULL,
    ValueName       NVARCHAR(60) NOT NULL,
    CONSTRAINT FK_VariantValue_Option 
        FOREIGN KEY(VariantOptionId) REFERENCES dbo.VariantOption(Id)
);
CREATE INDEX IX_VariantValue_Option ON dbo.VariantValue(VariantOptionId);
GO

CREATE TABLE dbo.ProductVariant(
    Id           INT IDENTITY(1,1) CONSTRAINT PK_ProductVariant PRIMARY KEY,
    ProductId    INT NOT NULL,
    ColorValueId INT NULL,
    SizeValueId  INT NULL,
    SKU          NVARCHAR(60) NULL,
    Price        DECIMAL(10,2) NULL,
    StockQty     INT NOT NULL DEFAULT(0) CHECK (StockQty >= 0),
    CreatedAt    DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt    DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_ProductVariant_Product 
        FOREIGN KEY(ProductId) REFERENCES dbo.Product(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ProductVariant_Color 
        FOREIGN KEY(ColorValueId) REFERENCES dbo.VariantValue(Id),
    CONSTRAINT FK_ProductVariant_Size 
        FOREIGN KEY(SizeValueId) REFERENCES dbo.VariantValue(Id)
);
CREATE INDEX IX_ProductVariant_Product ON dbo.ProductVariant(ProductId);
CREATE INDEX IX_ProductVariant_Color ON dbo.ProductVariant(ColorValueId);
CREATE INDEX IX_ProductVariant_Size ON dbo.ProductVariant(SizeValueId);
GO

/* ========== SERVICE CATALOG SYSTEM (MODIFIED) ========== */

CREATE TABLE dbo.ServiceCatalog(
    Id                INT IDENTITY(1,1) CONSTRAINT PK_ServiceCatalog PRIMARY KEY,
    SubCategoryId     INT NOT NULL,
    Name              NVARCHAR(120) NOT NULL,
    Description       NVARCHAR(255) NULL,
    MinPrice          DECIMAL(10,2) NULL,
    MaxPrice          DECIMAL(10,2) NULL,
    EstimatedDuration INT NULL,
    IsActive          BIT NOT NULL DEFAULT(1),
    CreatedAt         DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_ServiceCatalog_SubCategory 
        FOREIGN KEY(SubCategoryId) REFERENCES dbo.SubCategory(Id),
    CONSTRAINT CK_ServiceCatalog_PriceRange 
        CHECK (MinPrice IS NULL OR MaxPrice IS NULL OR MinPrice <= MaxPrice)
);
CREATE INDEX IX_ServiceCatalog_SubCat ON dbo.ServiceCatalog(SubCategoryId);
GO

/* ========== SERVICE PROVIDER APPLICATION ========== */

CREATE TABLE dbo.ProviderApplication(
    Id                INT IDENTITY(1,1) CONSTRAINT PK_ProviderApplication PRIMARY KEY,
    ServiceProviderId INT NOT NULL,
    Status            NVARCHAR(20) NOT NULL DEFAULT('Pending'),
    Notes             NVARCHAR(500) NULL,
    CreatedAt         DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt         DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_ProviderApplication_Provider 
        FOREIGN KEY(ServiceProviderId) REFERENCES dbo.ServiceProvider(Id)
);
CREATE INDEX IX_ProviderApplication_Provider ON dbo.ProviderApplication(ServiceProviderId);
GO

CREATE TABLE dbo.ProviderApplicationService(
    Id                    INT IDENTITY(1,1) CONSTRAINT PK_ProviderApplicationService PRIMARY KEY,
    ProviderApplicationId INT NOT NULL,
    ServiceCatalogId      INT NOT NULL,
    CONSTRAINT FK_PAS_Application 
        FOREIGN KEY(ProviderApplicationId) REFERENCES dbo.ProviderApplication(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PAS_ServiceCatalog 
        FOREIGN KEY(ServiceCatalogId) REFERENCES dbo.ServiceCatalog(Id)
);
CREATE INDEX IX_PAS_App ON dbo.ProviderApplicationService(ProviderApplicationId);
CREATE INDEX IX_PAS_Catalog ON dbo.ProviderApplicationService(ServiceCatalogId);
GO

CREATE TABLE dbo.ProviderCertificate(
    Id                    INT IDENTITY(1,1) CONSTRAINT PK_ProviderCertificate PRIMARY KEY,
    ProviderApplicationId INT NOT NULL,
    Title                 NVARCHAR(120) NOT NULL,
    FileUrl               NVARCHAR(300) NULL,
    ExpiresAt             DATE NULL,
    CreatedAt             DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_ProviderCertificate_Application 
        FOREIGN KEY(ProviderApplicationId) REFERENCES dbo.ProviderApplication(Id) ON DELETE CASCADE
);
CREATE INDEX IX_ProviderCertificate_App ON dbo.ProviderCertificate(ProviderApplicationId);
GO

/* ========== TIME SLOT SYSTEM (NEW) ========== */

CREATE TABLE dbo.TimeSlot(
    Id                INT IDENTITY(1,1) CONSTRAINT PK_TimeSlot PRIMARY KEY,
    ServiceProviderId INT NOT NULL,
    DayOfWeek         TINYINT NOT NULL,
    StartTime         TIME(0) NOT NULL,
    EndTime           TIME(0) NOT NULL,
    IsActive          BIT NOT NULL DEFAULT(1),
    CreatedAt         DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_TimeSlot_Provider 
        FOREIGN KEY(ServiceProviderId) REFERENCES dbo.ServiceProvider(Id) ON DELETE CASCADE,
    CONSTRAINT CK_TimeSlot_DayOfWeek CHECK (DayOfWeek BETWEEN 0 AND 6),
    CONSTRAINT CK_TimeSlot_Time CHECK (StartTime < EndTime)
);
CREATE INDEX IX_TimeSlot_Provider ON dbo.TimeSlot(ServiceProviderId);
CREATE INDEX IX_TimeSlot_Provider_Day ON dbo.TimeSlot(ServiceProviderId, DayOfWeek, IsActive);
GO

/* ========== ORDER SYSTEM (MODIFIED) ========== */

CREATE TABLE dbo.Orders(
    Id                INT IDENTITY(1,1) CONSTRAINT PK_Orders PRIMARY KEY,
    CustomerId        INT NOT NULL,
    SellerId          INT NOT NULL,
    DeliveryAddressId INT NULL,
    PickupAddressId   INT NULL,
    PaymentMethod     NVARCHAR(20) NOT NULL,
    PaymentStatus     NVARCHAR(20) NOT NULL,
    FulfillmentType   NVARCHAR(20) NOT NULL,
    Status            NVARCHAR(20) NOT NULL,
    SubtotalAmount    DECIMAL(10,2) NOT NULL DEFAULT(0),
    DeliveryFee       DECIMAL(10,2) NOT NULL DEFAULT(0),
    TotalAmount       AS (SubtotalAmount + DeliveryFee) PERSISTED,
    CreatedAt         DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt         DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Orders_Customer 
        FOREIGN KEY(CustomerId) REFERENCES dbo.Customer(Id),
    CONSTRAINT FK_Orders_Seller 
        FOREIGN KEY(SellerId) REFERENCES dbo.Seller(Id),
    CONSTRAINT FK_Orders_DeliveryAddress 
        FOREIGN KEY(DeliveryAddressId) REFERENCES dbo.Address(Id),
    CONSTRAINT FK_Orders_PickupAddress 
        FOREIGN KEY(PickupAddressId) REFERENCES dbo.Address(Id)
);
CREATE INDEX IX_Orders_Customer ON dbo.Orders(CustomerId);
CREATE INDEX IX_Orders_Seller ON dbo.Orders(SellerId);
CREATE INDEX IX_Orders_DeliveryAddress ON dbo.Orders(DeliveryAddressId);
GO

CREATE TABLE dbo.OrderItem(
    Id               INT IDENTITY(1,1) CONSTRAINT PK_OrderItem PRIMARY KEY,
    OrderId          INT NOT NULL,
    ProductVariantId INT NOT NULL,
    Qty              INT NOT NULL CHECK (Qty > 0),
    UnitPrice        DECIMAL(10,2) NOT NULL CHECK (UnitPrice >= 0),
    LineTotal        AS (Qty * UnitPrice) PERSISTED,
    CONSTRAINT FK_OrderItem_Order 
        FOREIGN KEY(OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItem_ProductVariant 
        FOREIGN KEY(ProductVariantId) REFERENCES dbo.ProductVariant(Id)
);
CREATE INDEX IX_OrderItem_Order ON dbo.OrderItem(OrderId);
CREATE INDEX IX_OrderItem_Var ON dbo.OrderItem(ProductVariantId);
GO

/* ========== PAYMENT SYSTEM (MODIFIED - Unified) ========== */

CREATE TABLE dbo.Payment(
    Id               INT IDENTITY(1,1) CONSTRAINT PK_Payment PRIMARY KEY,
    PaymentFor       NVARCHAR(20) NOT NULL DEFAULT('Order'),
    OrderId          INT NULL,
    ServiceBookingId INT NULL,
    PaymentType      NVARCHAR(20) NULL,
    GatewayName      NVARCHAR(60) NULL,
    ExternalRef      NVARCHAR(120) NULL,
    Amount           DECIMAL(10,2) NOT NULL DEFAULT(0),
    Status           NVARCHAR(20) NOT NULL DEFAULT('Unpaid'),
    CreatedAt        DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Payment_Order 
        FOREIGN KEY(OrderId) REFERENCES dbo.Orders(Id),
    CONSTRAINT CK_Payment_Reference 
        CHECK ((PaymentFor = 'Order' AND OrderId IS NOT NULL AND ServiceBookingId IS NULL) 
            OR (PaymentFor = 'ServiceBooking' AND ServiceBookingId IS NOT NULL AND OrderId IS NULL))
);
CREATE INDEX IX_Payment_Order ON dbo.Payment(OrderId);
CREATE INDEX IX_Payment_ServiceBooking ON dbo.Payment(ServiceBookingId);
GO

/* ========== SERVICE BOOKING SYSTEM (NEW) ========== */

CREATE TABLE dbo.ServiceBooking(
    Id                  INT IDENTITY(1,1) CONSTRAINT PK_ServiceBooking PRIMARY KEY,
    CustomerId          INT NOT NULL,
    ServiceProviderId   INT NOT NULL,
    ServiceCatalogId    INT NOT NULL,
    ServiceAddressId    INT NOT NULL,
    TimeSlotId          INT NULL,
    BookingDateTime     DATETIME2(3) NOT NULL,
    Status              NVARCHAR(30) NOT NULL DEFAULT('PendingQuote'),
    ServiceType         NVARCHAR(20) NOT NULL DEFAULT('Home'),
    QuotedPrice         DECIMAL(10,2) NULL,
    DepositAmount       AS (QuotedPrice * 0.5) PERSISTED,
    FinalAmount         AS (QuotedPrice * 0.5) PERSISTED,
    Notes               NVARCHAR(500) NULL,
    CanceledBy          NVARCHAR(20) NULL,
    CancellationReason  NVARCHAR(300) NULL,
    CancellationFee     DECIMAL(10,2) NULL DEFAULT(0),
    CreatedAt           DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt           DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_ServiceBooking_Customer 
        FOREIGN KEY(CustomerId) REFERENCES dbo.Customer(Id),
    CONSTRAINT FK_ServiceBooking_Provider 
        FOREIGN KEY(ServiceProviderId) REFERENCES dbo.ServiceProvider(Id),
    CONSTRAINT FK_ServiceBooking_ServiceCatalog 
        FOREIGN KEY(ServiceCatalogId) REFERENCES dbo.ServiceCatalog(Id),
    CONSTRAINT FK_ServiceBooking_Address 
        FOREIGN KEY(ServiceAddressId) REFERENCES dbo.Address(Id),
    CONSTRAINT FK_ServiceBooking_TimeSlot 
        FOREIGN KEY(TimeSlotId) REFERENCES dbo.TimeSlot(Id)
);
CREATE INDEX IX_ServiceBooking_Customer ON dbo.ServiceBooking(CustomerId);
CREATE INDEX IX_ServiceBooking_Provider ON dbo.ServiceBooking(ServiceProviderId);
CREATE INDEX IX_ServiceBooking_ServiceAddress ON dbo.ServiceBooking(ServiceAddressId);
CREATE INDEX IX_ServiceBooking_Status ON dbo.ServiceBooking(Status);
GO

-- Add FK from Payment to ServiceBooking (after ServiceBooking is created)
ALTER TABLE dbo.Payment ADD
    CONSTRAINT FK_Payment_ServiceBooking 
        FOREIGN KEY(ServiceBookingId) REFERENCES dbo.ServiceBooking(Id);
GO

/* ========== DELIVERY SYSTEM (MODIFIED) ========== */

CREATE TABLE dbo.DeliveryTicket(
    Id                INT IDENTITY(1,1) CONSTRAINT PK_DeliveryTicket PRIMARY KEY,
    OrderId           INT NOT NULL,
    DriverId          INT NULL,
    PickupAddressId   INT NULL,
    DeliveryAddressId INT NULL,
    Status            NVARCHAR(20) NOT NULL DEFAULT('Open'),
    CreatedAt         DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt         DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_DeliveryTicket_Order 
        FOREIGN KEY(OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
    CONSTRAINT FK_DeliveryTicket_Driver 
        FOREIGN KEY(DriverId) REFERENCES dbo.Driver(Id),
    CONSTRAINT FK_DeliveryTicket_PickupAddress 
        FOREIGN KEY(PickupAddressId) REFERENCES dbo.Address(Id),
    CONSTRAINT FK_DeliveryTicket_DeliveryAddress 
        FOREIGN KEY(DeliveryAddressId) REFERENCES dbo.Address(Id)
);
CREATE UNIQUE INDEX UX_DeliveryTicket_Order ON dbo.DeliveryTicket(OrderId);
CREATE INDEX IX_DeliveryTicket_Driver ON dbo.DeliveryTicket(DriverId);
GO

/* ========== REVIEW SYSTEMS ========== */

-- Product reviews
CREATE TABLE dbo.Review(
    Id                      INT IDENTITY(1,1) CONSTRAINT PK_Review PRIMARY KEY,
    OrderId                 INT NOT NULL,
    ProductId               INT NOT NULL,
    CustomerId              INT NOT NULL,
    Rating                  INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment                 NVARCHAR(MAX) NULL,
    IsCommentHiddenBySeller BIT NOT NULL DEFAULT(0),
    HiddenAt                DATETIME2(3) NULL,
    HiddenReason            NVARCHAR(200) NULL,
    CreatedAt               DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Review_Order 
        FOREIGN KEY(OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Review_Product 
        FOREIGN KEY(ProductId) REFERENCES dbo.Product(Id),
    CONSTRAINT FK_Review_Customer 
        FOREIGN KEY(CustomerId) REFERENCES dbo.Customer(Id)
);
CREATE INDEX IX_Review_Product ON dbo.Review(ProductId);
CREATE INDEX IX_Review_Customer ON dbo.Review(CustomerId);
CREATE INDEX IX_Review_Order ON dbo.Review(OrderId);
GO

-- Service reviews (NEW - separate table)
CREATE TABLE dbo.ServiceReview(
    Id                INT IDENTITY(1,1) CONSTRAINT PK_ServiceReview PRIMARY KEY,
    ServiceBookingId  INT NOT NULL,
    ServiceProviderId INT NOT NULL,
    CustomerId        INT NOT NULL,
    OverallRating     INT NOT NULL CHECK (OverallRating BETWEEN 1 AND 5),
    QualityRating     INT NULL CHECK (QualityRating BETWEEN 1 AND 5),
    ProfessionalismRating INT NULL CHECK (ProfessionalismRating BETWEEN 1 AND 5),
    TimelinessRating  INT NULL CHECK (TimelinessRating BETWEEN 1 AND 5),
    Comment           NVARCHAR(MAX) NULL,
    ProviderResponse  NVARCHAR(MAX) NULL,
    RespondedAt       DATETIME2(3) NULL,
    CreatedAt         DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_ServiceReview_Booking 
        FOREIGN KEY(ServiceBookingId) REFERENCES dbo.ServiceBooking(Id),
    CONSTRAINT FK_ServiceReview_Provider 
        FOREIGN KEY(ServiceProviderId) REFERENCES dbo.ServiceProvider(Id),
    CONSTRAINT FK_ServiceReview_Customer 
        FOREIGN KEY(CustomerId) REFERENCES dbo.Customer(Id)
);
CREATE INDEX IX_ServiceReview_Booking ON dbo.ServiceReview(ServiceBookingId);
CREATE INDEX IX_ServiceReview_Provider ON dbo.ServiceReview(ServiceProviderId);
CREATE INDEX IX_ServiceReview_Customer ON dbo.ServiceReview(CustomerId);
GO

/* ========== NOTIFICATION & MESSAGING ========== */

-- Unified notification system
CREATE TABLE dbo.Notification(
    Id              INT IDENTITY(1,1) CONSTRAINT PK_Notification PRIMARY KEY,
    RecipientUserId INT NOT NULL,
    SenderUserId    INT NULL,
    Type            NVARCHAR(50) NOT NULL,
    Title           NVARCHAR(120) NULL,
    Body            NVARCHAR(MAX) NOT NULL,
    RelatedEntityType NVARCHAR(30) NULL,
    RelatedEntityId INT NULL,
    IsRead          BIT NOT NULL DEFAULT(0),
    CreatedAt       DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Notification_Recipient 
        FOREIGN KEY(RecipientUserId) REFERENCES dbo.UserProfile(Id),
    CONSTRAINT FK_Notification_Sender 
        FOREIGN KEY(SenderUserId) REFERENCES dbo.UserProfile(Id)
);
CREATE INDEX IX_Notification_Recipient_Read ON dbo.Notification(RecipientUserId, IsRead);
CREATE INDEX IX_Notification_Type ON dbo.Notification(Type);
GO

-- Messaging system
CREATE TABLE dbo.Message(
    Id              INT IDENTITY(1,1) CONSTRAINT PK_Message PRIMARY KEY,
    SenderUserId    INT NOT NULL,
    RecipientUserId INT NOT NULL,
    Content         NVARCHAR(MAX) NOT NULL,
    IsRead          BIT NOT NULL DEFAULT(0),
    CreatedAt       DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Message_Sender 
        FOREIGN KEY(SenderUserId) REFERENCES dbo.UserProfile(Id),
    CONSTRAINT FK_Message_Recipient 
        FOREIGN KEY(RecipientUserId) REFERENCES dbo.UserProfile(Id)
);
CREATE INDEX IX_Message_Recipient_Read ON dbo.Message(RecipientUserId, IsRead);
CREATE INDEX IX_Message_Sender ON dbo.Message(SenderUserId);
GO

/* ========== AUDIT & ADMIN ========== */

CREATE TABLE dbo.AuditLogs(
    Id          INT IDENTITY(1,1) CONSTRAINT PK_AuditLogs PRIMARY KEY,
    ActorUserId INT NULL,
    EventType   NVARCHAR(80) NOT NULL,
    TargetTable NVARCHAR(100) NULL,
    TargetId    INT NULL,
    Description NVARCHAR(500) NULL,
    Severity    NVARCHAR(20) NULL,
    CreatedAt   DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_AuditLogs_Actor 
        FOREIGN KEY(ActorUserId) REFERENCES dbo.UserProfile(Id)
);
CREATE INDEX IX_AuditLogs_Actor ON dbo.AuditLogs(ActorUserId);
CREATE INDEX IX_AuditLogs_Target ON dbo.AuditLogs(TargetTable, TargetId);
CREATE INDEX IX_AuditLogs_EventType ON dbo.AuditLogs(EventType);
GO

CREATE TABLE dbo.AdminProfile(
    Id            INT IDENTITY(1,1) CONSTRAINT PK_AdminProfile PRIMARY KEY,
    UserProfileId INT NOT NULL UNIQUE,
    Title         NVARCHAR(100) NULL,
    Permissions   NVARCHAR(MAX) NULL,
    CreatedAt     DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_AdminProfile_UserProfile 
        FOREIGN KEY(UserProfileId) REFERENCES dbo.UserProfile(Id)
);
GO

CREATE TABLE dbo.Announcements(
    Id          INT IDENTITY(1,1) CONSTRAINT PK_Announcements PRIMARY KEY,
    AdminUserId INT NOT NULL,
    Title       NVARCHAR(200) NOT NULL,
    Message     NVARCHAR(MAX) NOT NULL,
    Audience    NVARCHAR(50) NOT NULL DEFAULT('All'),
    IsActive    BIT NOT NULL DEFAULT(1),
    CreatedAt   DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    ExpiresAt   DATETIME2(3) NULL,
    CONSTRAINT FK_Announcements_Admin 
        FOREIGN KEY(AdminUserId) REFERENCES dbo.UserProfile(Id)
);
CREATE INDEX IX_Announcements_Active ON dbo.Announcements(IsActive, ExpiresAt);
GO

/* ================================================================
   HELPFUL VIEWS FOR APPLICATION LOGIC
   ================================================================ */

-- View: Driver delivery routes
CREATE VIEW vw_DeliveryRoutes AS
SELECT 
    dt.Id AS DeliveryTicketId,
    dt.OrderId,
    dt.Status AS DeliveryStatus,
    
    -- Driver info
    d.Id AS DriverId,
    d.Phone AS DriverPhone,
    upDriver.DisplayName AS DriverName,
    
    -- Customer info
    c.Id AS CustomerId,
    c.Phone AS CustomerPhone,
    upCustomer.DisplayName AS CustomerName,
    
    -- Seller info
    s.Id AS SellerId,
    s.Phone AS SellerPhone,
    s.StoreName,
    
    -- Pickup address (seller shop)
    pickupAddr.Id AS PickupAddressId,
    pickupAddr.Street AS PickupStreet,
    pickupAddr.City AS PickupCity,
    pickupAddr.Latitude AS PickupLat,
    pickupAddr.Longitude AS PickupLng,
    
    -- Delivery address (customer)
    deliveryAddr.Id AS DeliveryAddressId,
    deliveryAddr.Street AS DeliveryStreet,
    deliveryAddr.City AS DeliveryCity,
    deliveryAddr.Latitude AS DeliveryLat,
    deliveryAddr.Longitude AS DeliveryLng,
    
    o.TotalAmount,
    o.PaymentMethod,
    dt.CreatedAt,
    dt.UpdatedAt
FROM dbo.DeliveryTicket dt
INNER JOIN dbo.Orders o ON dt.OrderId = o.Id
INNER JOIN dbo.Customer c ON o.CustomerId = c.Id
INNER JOIN dbo.UserProfile upCustomer ON c.UserProfileId = upCustomer.Id
INNER JOIN dbo.Seller s ON o.SellerId = s.Id
LEFT JOIN dbo.Driver d ON dt.DriverId = d.Id
LEFT JOIN dbo.UserProfile upDriver ON d.UserProfileId = upDriver.Id
LEFT JOIN dbo.Address pickupAddr ON dt.PickupAddressId = pickupAddr.Id
LEFT JOIN dbo.Address deliveryAddr ON dt.DeliveryAddressId = deliveryAddr.Id;
GO

-- View: Service provider bookings with customer addresses
CREATE VIEW vw_ServiceProviderBookings AS
SELECT 
    sb.Id AS BookingId,
    sb.Status,
    sb.BookingDateTime,
    sb.ServiceType,
    sb.QuotedPrice,
    sb.DepositAmount,
    
    -- Provider info
    sp.Id AS ProviderId,
    sp.BusinessName,
    sp.Phone AS ProviderPhone,
    upProvider.DisplayName AS ProviderName,
    
    -- Customer info
    c.Id AS CustomerId,
    c.Phone AS CustomerPhone,
    upCustomer.DisplayName AS CustomerName,
    
    -- Service address
    addr.Id AS ServiceAddressId,
    addr.Label AS AddressLabel,
    addr.Street,
    addr.City,
    addr.Region,
    addr.Latitude,
    addr.Longitude,
    
    -- Service details
    sc.Name AS ServiceName,
    sc.Description AS ServiceDescription,
    
    sb.Notes,
    sb.CreatedAt
FROM dbo.ServiceBooking sb
INNER JOIN dbo.ServiceProvider sp ON sb.ServiceProviderId = sp.Id
INNER JOIN dbo.UserProfile upProvider ON sp.UserProfileId = upProvider.Id
INNER JOIN dbo.Customer c ON sb.CustomerId = c.Id
INNER JOIN dbo.UserProfile upCustomer ON c.UserProfileId = upCustomer.Id
INNER JOIN dbo.Address addr ON sb.ServiceAddressId = addr.Id
INNER JOIN dbo.ServiceCatalog sc ON sb.ServiceCatalogId = sc.Id;
GO

-- View: Customer order history with addresses
CREATE VIEW vw_CustomerOrderHistory AS
SELECT 
    o.Id AS OrderId,
    o.Status,
    o.PaymentStatus,
    o.FulfillmentType,
    o.TotalAmount,
    
    -- Customer info
    c.Id AS CustomerId,
    upCustomer.DisplayName AS CustomerName,
    
    -- Seller info
    s.Id AS SellerId,
    s.StoreName,
    
    -- Addresses
    deliveryAddr.Street AS DeliveryStreet,
    deliveryAddr.City AS DeliveryCity,
    pickupAddr.Street AS PickupStreet,
    pickupAddr.City AS PickupCity,
    
    o.CreatedAt,
    o.UpdatedAt
FROM dbo.Orders o
INNER JOIN dbo.Customer c ON o.CustomerId = c.Id
INNER JOIN dbo.UserProfile upCustomer ON c.UserProfileId = upCustomer.Id
INNER JOIN dbo.Seller s ON o.SellerId = s.Id
LEFT JOIN dbo.Address deliveryAddr ON o.DeliveryAddressId = deliveryAddr.Id
LEFT JOIN dbo.Address pickupAddr ON o.PickupAddressId = pickupAddr.Id;
GO

-- View: Service provider availability
CREATE VIEW vw_ProviderAvailability AS
SELECT 
    sp.Id AS ProviderId,
    sp.BusinessName,
    sp.Phone,
    sp.MinServicePrice,
    sp.MaxServicePrice,
    ts.Id AS TimeSlotId,
    ts.DayOfWeek,
    CASE ts.DayOfWeek
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END AS DayName,
    ts.StartTime,
    ts.EndTime,
    ts.IsActive
FROM dbo.ServiceProvider sp
INNER JOIN dbo.TimeSlot ts ON sp.Id = ts.ServiceProviderId
WHERE sp.Status = 'Approved' AND ts.IsActive = 1;
GO

/* ================================================================
   SEED DATA (Optional - uncomment to use)
   ================================================================ */

/*
-- Categories
INSERT dbo.Category(Name) VALUES (N'Food'),(N'Clothes'),(N'Self-Care');

-- Clothing subcategories
INSERT dbo.SubCategory(CategoryId, Name)
SELECT 2, N'Shirts' UNION ALL
SELECT 2, N'Pants' UNION ALL
SELECT 2, N'Dresses' UNION ALL
SELECT 2, N'Footwear' UNION ALL
SELECT 2, N'Accessories';

-- Variant options and values
INSERT dbo.VariantOption(Name) VALUES (N'Color'),(N'Size');

INSERT dbo.VariantValue(VariantOptionId, ValueName)
SELECT 1, N'Red' UNION ALL
SELECT 1, N'Blue' UNION ALL
SELECT 1, N'Black' UNION ALL
SELECT 1, N'White' UNION ALL
SELECT 2, N'S' UNION ALL
SELECT 2, N'M' UNION ALL
SELECT 2, N'L' UNION ALL
SELECT 2, N'XL';

-- Sample membership plans
INSERT dbo.MembershipPlan(Name, Description, MonthlyPrice, DurationDays)
VALUES 
    (N'Free', N'Basic access to platform', 0.00, NULL),
    (N'Premium', N'Priority support and exclusive deals', 9.99, 30),
    (N'VIP', N'All premium features plus free delivery', 19.99, 30);
*/

/* ================================================================
   SUMMARY OF KEY CHANGES FROM V1 TO V2.1
   ================================================================ */

/*
✅ NEW TABLES ADDED:
   - Customer (new role table following existing pattern)
   - Address (central address repository)
   - CustomerAddress, SellerAddress, ServiceProviderAddress (junction tables)
   - TimeSlot (provider availability scheduling)
   - ServiceBooking (service appointment system)
   - ServiceReview (separate from product reviews)

✅ MODIFIED TABLES:
   - Seller: Added Phone field
   - ServiceProvider: Added Phone, MinServicePrice, MaxServicePrice
   - ServiceCatalog: Added MinPrice, MaxPrice, EstimatedDuration
   - Orders: Added CustomerId, DeliveryAddressId, PickupAddressId
   - Payment: Added PaymentFor, ServiceBookingId, PaymentType (unified payment)
   - DeliveryTicket: Added PickupAddressId, DeliveryAddressId
   - Review: Changed CustomerUserId FK to CustomerId

✅ NEW VIEWS CREATED:
   - vw_DeliveryRoutes (driver navigation helper)
   - vw_ServiceProviderBookings (home service access)
   - vw_CustomerOrderHistory (order tracking)
   - vw_ProviderAvailability (booking availability)

✅ KEY FEATURES:
   - Unified address system with GPS coordinates
   - Service booking with 50% deposit + final payment
   - Custom pricing quotes within provider ranges
   - Weekly recurring time slot system
   - Cancellation tracking with fees
   - Separate review systems for products vs services
   - Unified payment gateway for orders and bookings
   - Driver access to both pickup and delivery addresses
   - Service provider access to customer addresses (home services)

✅ BUSINESS RULES ENFORCED:
   - One phone per user (removed from Address)
   - Customers can have multiple addresses
   - Sellers can have multiple shop locations
   - Service providers set availability windows
   - One service per booking
   - Payment type tracking (Deposit/Final/Full)
   - Service booking status flow with cancellation logic
*/