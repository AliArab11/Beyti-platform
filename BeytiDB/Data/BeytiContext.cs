using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

public partial class BeytiContext : DbContext
{
    public BeytiContext()
    {
    }

    public BeytiContext(DbContextOptions<BeytiContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Address> Addresses { get; set; }

    public virtual DbSet<AdminProfile> AdminProfiles { get; set; }

    public virtual DbSet<Announcement> Announcements { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<CustomerAddress> CustomerAddresses { get; set; }

    public virtual DbSet<DeliveryTicket> DeliveryTickets { get; set; }

    public virtual DbSet<Driver> Drivers { get; set; }

    public virtual DbSet<Gender> Genders { get; set; }

    public virtual DbSet<MembershipPlan> MembershipPlans { get; set; }

    public virtual DbSet<Message> Messages { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductVariant> ProductVariants { get; set; }

    public virtual DbSet<ProviderApplication> ProviderApplications { get; set; }

    public virtual DbSet<ProviderApplicationService> ProviderApplicationServices { get; set; }

    public virtual DbSet<ProviderCertificate> ProviderCertificates { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<Seller> Sellers { get; set; }

    public virtual DbSet<SellerAddress> SellerAddresses { get; set; }

    public virtual DbSet<ServiceBooking> ServiceBookings { get; set; }

    public virtual DbSet<ServiceCatalog> ServiceCatalogs { get; set; }

    public virtual DbSet<Service> Services { get; set; }

    public virtual DbSet<ServiceProvider> ServiceProviders { get; set; }

    public virtual DbSet<ServiceProviderAddress> ServiceProviderAddresses { get; set; }

    public virtual DbSet<ServiceReview> ServiceReviews { get; set; }

    public virtual DbSet<SubCategory> SubCategories { get; set; }

    public virtual DbSet<TimeSlot> TimeSlots { get; set; }

    public virtual DbSet<UserMembership> UserMemberships { get; set; }

    public virtual DbSet<UserProfile> UserProfiles { get; set; }

    public virtual DbSet<VariantOption> VariantOptions { get; set; }

    public virtual DbSet<VariantValue> VariantValues { get; set; }

    public virtual DbSet<vw_CustomerOrderHistory> vw_CustomerOrderHistories { get; set; }

    public virtual DbSet<vw_DeliveryRoute> vw_DeliveryRoutes { get; set; }

    public virtual DbSet<vw_ProviderAvailability> vw_ProviderAvailabilities { get; set; }

    public virtual DbSet<vw_ServiceProviderBooking> vw_ServiceProviderBookings { get; set; }

    public virtual DbSet<ServiceCategory> ServiceCategories { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=(localdb)\\MSSQLLocalDB;Database=Beyti-V1;Trusted_Connection=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Address>(entity =>
        {
            entity.Property(e => e.Country).HasDefaultValue("Bahrain");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");
        });

        modelBuilder.Entity<AdminProfile>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.UserProfile).WithOne(p => p.AdminProfile)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AdminProfile_UserProfile");
        });

        modelBuilder.Entity<Announcement>(entity =>
        {
            entity.Property(e => e.Audience).HasDefaultValue("All");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.AdminUser).WithMany(p => p.Announcements)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Announcements_Admin");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.ActorUser).WithMany(p => p.AuditLogs).HasConstraintName("FK_AuditLogs_Actor");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.UserProfile).WithOne(p => p.Customer)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Customer_UserProfile");
        });

        modelBuilder.Entity<CustomerAddress>(entity =>
        {
            entity.HasOne(d => d.Address).WithMany(p => p.CustomerAddresses).HasConstraintName("FK_CustomerAddress_Address");

            entity.HasOne(d => d.Customer).WithMany(p => p.CustomerAddresses).HasConstraintName("FK_CustomerAddress_Customer");
        });

        modelBuilder.Entity<DeliveryTicket>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status).HasDefaultValue("Open");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.DeliveryAddress).WithMany(p => p.DeliveryTicketDeliveryAddresses).HasConstraintName("FK_DeliveryTicket_DeliveryAddress");

            entity.HasOne(d => d.Driver).WithMany(p => p.DeliveryTickets).HasConstraintName("FK_DeliveryTicket_Driver");

            entity.HasOne(d => d.Order).WithOne(p => p.DeliveryTicket).HasConstraintName("FK_DeliveryTicket_Order");

            entity.HasOne(d => d.PickupAddress).WithMany(p => p.DeliveryTicketPickupAddresses).HasConstraintName("FK_DeliveryTicket_PickupAddress");
        });

        modelBuilder.Entity<Driver>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status).HasDefaultValue("Available");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.UserProfile).WithOne(p => p.Driver)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Driver_UserProfile");
        });

        modelBuilder.Entity<MembershipPlan>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.RecipientUser).WithMany(p => p.MessageRecipientUsers)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Message_Recipient");

            entity.HasOne(d => d.SenderUser).WithMany(p => p.MessageSenderUsers)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Message_Sender");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.RecipientUser).WithMany(p => p.NotificationRecipientUsers)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notification_Recipient");

            entity.HasOne(d => d.SenderUser).WithMany(p => p.NotificationSenderUsers).HasConstraintName("FK_Notification_Sender");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.TotalAmount).HasComputedColumnSql("([SubtotalAmount]+[DeliveryFee])", true);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Customer).WithMany(p => p.Orders)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Orders_Customer");

            entity.HasOne(d => d.DeliveryAddress).WithMany(p => p.OrderDeliveryAddresses).HasConstraintName("FK_Orders_DeliveryAddress");

            entity.HasOne(d => d.PickupAddress).WithMany(p => p.OrderPickupAddresses).HasConstraintName("FK_Orders_PickupAddress");

            entity.HasOne(d => d.Seller).WithMany(p => p.Orders)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Orders_Seller");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(e => e.LineTotal).HasComputedColumnSql("([Qty]*[UnitPrice])", true);

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems).HasConstraintName("FK_OrderItem_Order");

            entity.HasOne(d => d.ProductVariant).WithMany(p => p.OrderItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderItem_ProductVariant");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.PaymentFor).HasDefaultValue("Order");
            entity.Property(e => e.Status).HasDefaultValue("Unpaid");

            entity.HasOne(d => d.Order).WithMany(p => p.Payments).HasConstraintName("FK_Payment_Order");

            entity.HasOne(d => d.ServiceBooking).WithMany(p => p.Payments).HasConstraintName("FK_Payment_ServiceBooking");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Gender).WithMany(p => p.Products).HasConstraintName("FK_Product_Gender");

            entity.HasOne(d => d.Seller).WithMany(p => p.Products)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Product_Seller");

            entity.HasOne(d => d.SubCategory).WithMany(p => p.Products)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Product_SubCategory");
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.ColorValue).WithMany(p => p.ProductVariantColorValues).HasConstraintName("FK_ProductVariant_Color");

            entity.HasOne(d => d.Product).WithMany(p => p.ProductVariants).HasConstraintName("FK_ProductVariant_Product");

            entity.HasOne(d => d.SizeValue).WithMany(p => p.ProductVariantSizeValues).HasConstraintName("FK_ProductVariant_Size");
        });

        modelBuilder.Entity<ProviderApplication>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status).HasDefaultValue("Pending");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.ProviderApplications)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ProviderApplication_Provider");
        });

        modelBuilder.Entity<ProviderApplicationService>(entity =>
        {
            entity.HasOne(d => d.ProviderApplication).WithMany(p => p.ProviderApplicationServices).HasConstraintName("FK_PAS_Application");

            entity.HasOne(d => d.ServiceCatalog).WithMany(p => p.ProviderApplicationServices)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PAS_ServiceCatalog");
        });

        modelBuilder.Entity<ProviderCertificate>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.ProviderApplication).WithMany(p => p.ProviderCertificates).HasConstraintName("FK_ProviderCertificate_Application");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Customer).WithMany(p => p.Reviews)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Review_Customer");

            entity.HasOne(d => d.Order).WithMany(p => p.Reviews).HasConstraintName("FK_Review_Order");

            entity.HasOne(d => d.Product).WithMany(p => p.Reviews)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Review_Product");
        });

        modelBuilder.Entity<Seller>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.UserProfile).WithOne(p => p.Seller)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Seller_UserProfile");
        });

        modelBuilder.Entity<SellerAddress>(entity =>
        {
            entity.HasOne(d => d.Address).WithMany(p => p.SellerAddresses).HasConstraintName("FK_SellerAddress_Address");

            entity.HasOne(d => d.Seller).WithMany(p => p.SellerAddresses).HasConstraintName("FK_SellerAddress_Seller");
        });

        modelBuilder.Entity<ServiceBooking>(entity =>
        {
            entity.Property(e => e.CancellationFee).HasDefaultValue(0m);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DepositAmount).HasComputedColumnSql("([QuotedPrice]*(0.5))", true);
            entity.Property(e => e.FinalAmount).HasComputedColumnSql("([QuotedPrice]*(0.5))", true);
            entity.Property(e => e.ServiceType).HasDefaultValue("Home");
            entity.Property(e => e.Status).HasDefaultValue("PendingQuote");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Customer).WithMany(p => p.ServiceBookings)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ServiceBooking_Customer");

            entity.HasOne(d => d.ServiceAddress).WithMany(p => p.ServiceBookings)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ServiceBooking_Address");

            entity.HasOne(d => d.ServiceCatalog).WithMany(p => p.ServiceBookings)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ServiceBooking_ServiceCatalog");

            entity.HasOne(d => d.Service).WithMany(p => p.ServiceBookings)
                .HasForeignKey(d => d.ServiceId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_ServiceBooking_Service");

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.ServiceBookings)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ServiceBooking_Provider");

            entity.HasOne(d => d.TimeSlot).WithMany(p => p.ServiceBookings).HasConstraintName("FK_ServiceBooking_TimeSlot");
        });

        modelBuilder.Entity<ServiceCatalog>(entity =>
        {
            // 1. Match the SQL default (changed from sysutcdatetime to sysdatetime)
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");

            entity.Property(e => e.IsActive).HasDefaultValue(true);

            // 2. Point to the NEW ServiceCategory table
            entity.HasOne(d => d.ServiceCategory)
                .WithMany(p => p.ServiceCatalogs) // Matches the list in ServiceCategory.cs
                .HasForeignKey(d => d.ServiceCategoryId) // Matches the new int column
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ServiceCatalog_ServiceCategory"); // Matches the new SQL Constraint
        });

        modelBuilder.Entity<ServiceCategory>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<Service>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.ServiceProvider)
                .WithMany(p => p.Services)
                .HasForeignKey(d => d.ServiceProviderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Service_ServiceProvider");

            entity.HasOne(d => d.ServiceCatalog)
                .WithMany(p => p.Services)
                .HasForeignKey(d => d.ServiceCatalogId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Service_ServiceCatalog");
        });

        modelBuilder.Entity<ServiceProvider>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status).HasDefaultValue("Pending");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.UserProfile).WithOne(p => p.ServiceProvider)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ServiceProvider_UserProfile");

            entity.HasOne(d => d.ServiceCategory)
                .WithMany(p => p.ServiceProviders)
                .HasForeignKey(d => d.ServiceCategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ServiceProvider_ServiceCategory");
        });

        modelBuilder.Entity<ServiceProviderAddress>(entity =>
        {
            entity.HasOne(d => d.Address).WithMany(p => p.ServiceProviderAddresses).HasConstraintName("FK_ServiceProviderAddress_Address");

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.ServiceProviderAddresses).HasConstraintName("FK_ServiceProviderAddress_Provider");
        });

        modelBuilder.Entity<ServiceReview>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Customer).WithMany(p => p.ServiceReviews)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ServiceReview_Customer");

            entity.HasOne(d => d.ServiceBooking).WithMany(p => p.ServiceReviews)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ServiceReview_Booking");

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.ServiceReviews)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ServiceReview_Provider");
        });

        modelBuilder.Entity<SubCategory>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Category).WithMany(p => p.SubCategories)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SubCategory_Category");
        });

        modelBuilder.Entity<TimeSlot>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.TimeSlots).HasConstraintName("FK_TimeSlot_Provider");
        });

        modelBuilder.Entity<UserMembership>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.MembershipPlan).WithMany(p => p.UserMemberships)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserMembership_Plan");

            entity.HasOne(d => d.UserProfile).WithMany(p => p.UserMemberships)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserMembership_UserProfile");
        });

        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.HasIndex(e => e.IdentityUserId, "UX_UserProfile_IdentityUserId")
                .IsUnique()
                .HasFilter("([IdentityUserId] IS NOT NULL)");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status).HasDefaultValue("Active");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");
        });

        modelBuilder.Entity<VariantValue>(entity =>
        {
            entity.HasOne(d => d.VariantOption).WithMany(p => p.VariantValues)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VariantValue_Option");
        });

        modelBuilder.Entity<vw_CustomerOrderHistory>(entity =>
        {
            entity.ToView("vw_CustomerOrderHistory");
        });

        modelBuilder.Entity<vw_DeliveryRoute>(entity =>
        {
            entity.ToView("vw_DeliveryRoutes");
        });

        modelBuilder.Entity<vw_ProviderAvailability>(entity =>
        {
            entity.ToView("vw_ProviderAvailability");
        });

        modelBuilder.Entity<vw_ServiceProviderBooking>(entity =>
        {
            entity.ToView("vw_ServiceProviderBookings");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
