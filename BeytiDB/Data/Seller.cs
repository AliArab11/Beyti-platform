using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("Seller")]
[Index("UserProfileId", Name = "IX_Seller_UserProfile")]
[Index("UserProfileId", Name = "UQ__Seller__9E267F63348F9C5C", IsUnique = true)]
public partial class Seller
{
    [Key]
    public int Id { get; set; }

    public int UserProfileId { get; set; }

    [StringLength(120)]
    [Required]
    public string StoreName { get; set; } = string.Empty;  // Required, not nullable

    [StringLength(30)]
    public string? Phone { get; set; }  // Optional

    [NotMapped] // This means it won't be stored in database, just calculated
    public decimal? AverageRating { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    public bool IsOpen { get; set; }

    [StringLength(500)]
    public string? StoreDescription { get; set; }

    [StringLength(500)]
    public string? StoreImageUrl { get; set; }   // main store picture

    public TimeSpan? OpenTime { get; set; }
    public TimeSpan? CloseTime { get; set; }
    public bool? IsManuallyClosed { get; set; }

    public bool? IsForceOpen { get; set; }

    // ADD THIS NEW LINE:
    public DateTime? ForceOpenStartTime { get; set; }  // Track when force open was activated

    // 🔹 MAIN STORE CATEGORY (Food / Clothes / Self Care)
    public int CategoryId { get; set; }

    [ForeignKey("CategoryId")]
    public virtual Category Category { get; set; } = null!;

    // 🔹 SUBCATEGORIES (max 3 – enforced in backend)
    public virtual ICollection<SellerSubCategory> SellerSubCategories { get; set; }
        = new List<SellerSubCategory>();

    [InverseProperty("Seller")]
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    [InverseProperty("Seller")]
    public virtual ICollection<StoreSection> StoreSections { get; set; }
    = new List<StoreSection>();

    [InverseProperty(nameof(CustomerFavoriteSeller.Seller))]
    public virtual ICollection<CustomerFavoriteSeller> FavoritedByCustomers { get; set; }
    = new List<CustomerFavoriteSeller>();


    [InverseProperty("Seller")]
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    [InverseProperty("Seller")]
    public virtual ICollection<SellerAddress> SellerAddresses { get; set; } = new List<SellerAddress>();

    [ForeignKey("UserProfileId")]
    [InverseProperty("Seller")]
    public virtual UserProfile UserProfile { get; set; } = null!;
}
